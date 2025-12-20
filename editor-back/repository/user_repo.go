package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID string
	Email string
	PasswordHash string
	Role string
}

// “Доменные” ошибки — удобно, чтобы handlers не знали про PG-коды
var ErrEmailTaken = errors.New("email already taken")
var ErrNotFound = errors.New("not found")

type UserRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, email string, passHash string) (User, error) {
	var u User
	err := r.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'user') RETURNING email, email, password_hash, role  
	`, email, passHash).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role)

	if err != nil {
		// PG-код 23505 = unique_violation (например, email уже существует)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailTaken
		}
		return User{}, err
	}

	return u, nil
}

// GetByEmail нужен для логина: находим пользователя и берём хеш пароля.
func (r *UserRepo) GetByEmail(ctx *context.Context, email string) (User, error) {
	var u User
	err := r.db.QueryRow(`
		SELECT id, email, password_hash, role FROM users WHERE email = ?
	`, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role)

	if err != nil {
		// PG-код 23505 = unique_violation (например, email уже существует)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailTaken
		}
		return User{}, err
	}

	return u, nil
}