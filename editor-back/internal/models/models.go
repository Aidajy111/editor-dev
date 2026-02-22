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

type Order struct {
	ID              uuid.UUID `json:"id"`
	CustomerName    string    `json:"customer_name"`
	CustomerEmail   string    `json:"customer_email"`
	CustomerPhone   string    `json:"customer_phone"`
	CustomerComment string    `json:"customer_comment"`
	Status          string    `json:"status"` // new, paid, in_production, done, canceled
	CreatedAt       time.Time `json:"created_at"`
}

type OrderItems struct {
	ID             uuid.UUID `json:"id"`
	OrderID        uuid.UUID `json:"order_id"`         // FK на orders.id
	ModelID        int       `json:"model_id"`         // items[].model.id. Это id ModelDTO
	PhoneModelName string    `json:"phone_model_name"` // items[].model.name
	DesignJSON     []byte    `json:"jsonb"`            // Пока непонятно какие свойства тут, или просто в виде строки которую нужно парсить сделать
	PreviewKey     string    `json:"preview_key"`      // путь/ключ до preview-файла
	CreatedAt      time.Time `json:"created_at"`
}

type OrderAsset struct {
	ID          uuid.UUID `json:"id"`            // нужно ли это?
	OrderItemID uuid.UUID `json:"order_item_id"` // FK на OrderItems
	AssetID     string    `json:"asset_id"`      // тот самый assetId с фронта
	StorageKey  string    `json:"storage_key"`   // куда сохранили на диске
	Mime        string    `json:"mime"`
	SizeBytes   int64     `json:"size_bytes"`
}

// Модель телеофна - структура для входа и выхода
type ModelDTO struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Image  string `json:"image"`
	Camera string `json:"camera"`
	Edges  string `json:"edges"`
}

// Элементы дизайна - структура для входа и выхода
type ElementDTO struct {
	ID           int64   `json:"id"`
	Type         string  `json:"type"` // "image" | "text"
	X            float64 `json:"x"`
	Y            float64 `json:"y"`
	Width        float64 `json:"width,omitempty"`
	Height       float64 `json:"height,omitempty"`
	Rotation     float64 `json:"rotation"`
	AssetID      string  `json:"assetId,omitempty"`
	Text         string  `json:"text,omitempty"`
	FontFamily   string  `json:"fontFamily,omitempty"`
	FontSize     float64 `json:"fontSize,omitempty"`
	Fill         string  `json:"fill,omitempty"`
	CornerRadius float64 `json:"cornerRadius,omitempty"`
	FlipX        bool    `json:"flipX,omitempty"`
	FlipY        bool    `json:"flipY,omitempty"`
}

// структура для входа и выхода
type CustomerDTO struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Comment string `json:"comment"`
}

// структура для входа и выхода
type ItemDTO struct {
	ID             string       `json:"id"`
	Model          ModelDTO     `json:"model"`
	Elements       []ElementDTO `json:"elements"`
	PreviewAssetID string       `json:"previewAssetId"`
	CreatedAt      time.Time    `json:"createdAt"`
}
