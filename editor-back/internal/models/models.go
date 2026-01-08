package models

import (
	"time"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

// User - структура для
type User struct {
	ID           int64     `db:"id"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	Role         Role      `db:"role"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

type CaseStatus string

const (
	CaseStatusPending  CaseStatus = "pending"
	CaseStatusApproved CaseStatus = "approved"
	CaseStatusRejected CaseStatus = "rejected"
)

type Case struct {
	ID           int64     `db:"id"`
	UserId       int64     `db:"user_id"`
	PhoneModelID int64     `db:"phone_model_id"`
	Status       int64     `db:"status"`
	AdminComment *string   `db:"admin_comment"`
	PreviewURL   *string   `db:"preview_url"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
