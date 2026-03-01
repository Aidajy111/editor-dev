package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/Aidajy111/editor-dev/editor-back/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/redis/go-redis/v9"
)

func (r *OrderRepo) GetOrder(ctx context.Context, orderId string) (models.OrderBodyRedis, error) {
	key := fmt.Sprintf("%s", orderId)

	keyType, err := r.redis.Type(ctx, key).Result()
	if err != nil {
		return models.OrderBodyRedis{}, err
	}

	if keyType == "none" {
		return models.OrderBodyRedis{}, redis.Nil // ключ не найден
	}

	if keyType != "string" {
		return models.OrderBodyRedis{}, fmt.Errorf("unexpected key type: %s", keyType)
	}

	data, err := r.redis.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			// Если в Redis нет данных

			orderDB, err := r.GetOrderDB(ctx, key)
			if err != nil {
				return models.OrderBodyRedis{}, err
			}

			return orderDB, redis.Nil
		}
		return models.OrderBodyRedis{}, fmt.Errorf("get from redis: %w", err)
	}

	var order models.OrderBodyRedis
	if err := json.Unmarshal([]byte(data), &order); err != nil {
		return models.OrderBodyRedis{}, fmt.Errorf("unmarshal order: %w", err)
	}

	return order, nil
}

func (r *OrderRepo) GetOrderDB(ctx context.Context, orderId string) (models.OrderBodyRedis, error) {
	var order models.Order

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return models.OrderBodyRedis{}, err
	}
	defer tx.Rollback(ctx)

	if err = r.db.QueryRow(ctx, "SELECT id, customer_name, customer_email, customer_phone, customer_comment, status, created_at FROM orders WHERE id = $1", orderId).
		Scan(
			&order.ID,
			&order.CustomerName,
			&order.CustomerEmail,
			&order.CustomerPhone,
			&order.CustomerComment,
			&order.Status,
			&order.CreatedAt,
		); err != nil {
		if err == pgx.ErrNoRows {
			tx.Rollback(ctx)
			return models.OrderBodyRedis{}, fmt.Errorf("order not found")
		}
	}

	if err != nil {
		tx.Rollback(ctx)
		return models.OrderBodyRedis{}, fmt.Errorf("Select orders: %w", err)
	}

}
