package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdateAt     time.Time `json:"update_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterResponse struct {
	Message string `json:"message"`
	UserID  int64  `json:"user_id"`
	Email   string `json:"email"`
}

type Orders struct {
	ID              uuid.UUID `json:"id"`
	CustomerName    string    `json:"customer_name"`
	CustomerEmail   string    `json:"customer_email"`
	CustomerComment string    `json:"customer_comment"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
}

type Order_items struct {
	ID             uuid.UUID  `json:"id"`
	OrderID        string     `json:"order_id"`         // FK на orders.id
	ModelID        string     `json:"model_id"`         // items[].model.id
	PhoneModelName string     `json:"phone_model_name"` // items[].model.name
	DesignJSON     DesignJSON `json:"design_json"`      // тоже структура
	FileID         string     `json:"file_id"`          // по сути id папки /uploads/orders/FileID/preview/ и /asset/
}
type DesignJSON struct {
}
