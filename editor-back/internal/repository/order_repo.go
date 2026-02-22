package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Aidajy111/editor-dev/editor-back/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrderRepo struct {
	db *pgxpool.Pool
}

// NewOrderRepo - получает пул соединений готовый к которому могут обращаться методы структуры OrderRepo
func NewOrderRepo(db *pgxpool.Pool) *OrderRepo {
	return &OrderRepo{db: db}
}

func (r *OrderRepo) CreateOrder(
	ctx context.Context,
	order models.Order,
	items []models.OrderItems,
	assets []models.OrderAsset,
) (models.Order, error) {
	orderID := uuid.New()

	var Order models.Order
	err := r.db.QueryRow(ctx, `
        INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_comment, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, customer_name, customer_email, customer_phone, customer_comment, status
    `, orderID, order.CustomerName, order.CustomerEmail, order.CustomerPhone, order.CustomerComment, order.Status).Scan(
		&Order.ID, &Order.CustomerName, &Order.CustomerEmail, &Order.CustomerPhone, &Order.CustomerComment, &order.Status,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return models.Order{}, fmt.Errorf("create order: %w", err)
		}
		return models.Order{}, fmt.Errorf("create order: %w", err)
	}

	// Цель: при создании заказа сохранить всё в БД, кэшировать и отправить событие.
	// Шаги
	// 1) Транзакция БД
	// orders → order_items → order_assets.
	// Commit только если всё успешно.
	// 2) Redis
	// После commit: положить в кэш данные заказа (например order:<id> = JSON).
	// Кэшировать список заказов или статус (orders:list / order:<id>:status) по желанию.
	// TTL, например 10–30 минут.
	// 3) Kafka
	// После commit: отправить событие order.created.
	// Payload: orderId, customer, itemsCount, createdAt.
	// Ключ сообщения: orderId.
	// 4) Ошибки
	// Если БД упала → откат транзакции, ошибка клиенту.
	// Если Redis/Kafka упали → не ломать заказ, просто логировать ошибку (best effort).

	return Order, nil
}
