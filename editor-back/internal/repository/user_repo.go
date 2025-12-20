package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// User — минимальная структура пользователя, которую мы читаем/пишем в БД.
type User struct {
	ID           int64
	Email        string
	PasswordHash string
	Role         string
}

var ErrEmailTaken = errors.New("email already taken")
var ErrNotFound = errors.New("user not found")

type UserRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

// Create создаёт пользователя.
// Важно:
// - пароль хранится как password_hash (bcrypt), НЕ как plain password
// - email UNIQUE, поэтому при повторе ловим PG ошибку 23505
func (r *UserRepo) Create(ctx context.Context, email, passwordHash string) (User, error) {
	var u User

	err := r.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, role)
		VALUES ($1, $2, 'user')
		RETURNING id, email, password_hash, role
	`, email, passwordHash).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role)

	if err != nil {
		// 23505 = unique_violation (email уже есть)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailTaken
		}
		return User{}, err
	}

	return u, nil
}

// GetByEmail — нужен для логина: достаём хеш пароля и роль.
func (r *UserRepo) GetByEmail(ctx context.Context, email string) (User, error) {
	var u User

	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash, role
		FROM users
		WHERE email = $1
	`, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrNotFound
		}
		return User{}, err
	}

	return u, nil
}
