package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	Role         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

var ErrEmailTaken = errors.New("email already taken")
var ErrNotFound = errors.New("user not found")

type UserRepo struct {
	db *pgxpool.Pool
}

// NewUserRepo - получает пул соединений готовый к которому могут обращаться методы структуры UserRepo
func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

// Create создаёт пользователя
func (r *UserRepo) Create(ctx context.Context, email, passwordHash string) (User, error) {
	var u User

	err := r.db.QueryRow(ctx, `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, 'user')
        RETURNING id, email, password_hash, role, created_at, updated_at
    `, email, passwordHash).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailTaken
		}
		return User{}, fmt.Errorf("create user: %w", err)
	}

	return u, nil
}

// GetByEmail — нужен для логина: достаём хеш пароля и роль.
func (r *UserRepo) GetByEmail(ctx context.Context, email string) (User, error) {
	var u User

	err := r.db.QueryRow(ctx, `
        SELECT id, email, password_hash, role, created_at, updated_at
        FROM users
        WHERE email = $1
    `, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrNotFound
		}
		return User{}, err
	}

	return u, nil
}
