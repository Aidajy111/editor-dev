package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Aidajy111/editor-dev/editor-back/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type OrderRepo struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

// NewOrderRepo - получает пул соединений готовый к которому могут обращаться методы структуры OrderRepo
func NewOrderRepo(db *pgxpool.Pool, redis *redis.Client) *OrderRepo {
	return &OrderRepo{
		db:    db,
		redis: redis,
	}
}

func (r *OrderRepo) CreateOrder(
	ctx context.Context,
	order models.Order,
	items []models.OrderItems,
	assets []models.OrderAsset,
) (models.Order, error) {
	var Order models.Order

	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return models.Order{}, err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, `
        INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_comment, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, customer_name, customer_email, customer_phone, customer_comment, status, created_at
    `, order.ID, order.CustomerName, order.CustomerEmail, order.CustomerPhone, order.CustomerComment, order.Status, order.CreatedAt).Scan(
		&Order.ID, &Order.CustomerName, &Order.CustomerEmail, &Order.CustomerPhone, &Order.CustomerComment, &Order.Status, &Order.CreatedAt,
	)

	if err != nil {
		tx.Rollback(ctx)
		return models.Order{}, fmt.Errorf("create order: %w", err)
	}

	// Создаем структуру для Redis
	reqOrderBodyRedis := models.OrderBodyRedis{
		ID:              order.ID,
		CustomerName:    order.CustomerName,
		CustomerEmail:   order.CustomerEmail,
		CustomerPhone:   order.CustomerPhone,
		CustomerComment: order.CustomerComment,
		Status:          order.Status,
		CreatedAt:       order.CreatedAt,
		Items:           make([]models.OrderItemsRedis, 0, len(items)),
	}

	for _, item := range items {
		_, err = tx.Exec(ctx, `
			INSERT INTO order_items (id, order_id, model_id, phone_model_name, design_json, preview_key, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, order_id, model_id, phone_model_name, design_json, preview_key, created_at
		`, item.ID, item.OrderID, item.ModelID, item.PhoneModelName, item.DesignJSON, item.PreviewKey, item.CreatedAt)
		if err != nil {
			tx.Rollback(ctx)
			return models.Order{}, fmt.Errorf("create items order: %w", err)
		}

		orderBodyRedisItems := models.OrderItemsRedis{
			ID:             item.ID,
			OrderID:        item.OrderID,
			ModelID:        item.ModelID,
			PhoneModelName: item.PhoneModelName,
			DesignJSON:     item.DesignJSON,
			PreviewKey:     item.PreviewKey,
			Assets:         make([]models.OrderAssetRedis, 0, len(assets)),
		}

		for _, asset := range assets {
			_, err = tx.Exec(ctx, `
			INSERT INTO order_assets (id, order_item_id, asset_id, storage_key, mime, size_bytes)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, order_item_id, asset_id, storage_key, mime, size_bytes
		`, asset.ID, asset.OrderItemID, asset.AssetID, asset.StorageKey, asset.Mime, asset.SizeBytes)
			if err != nil {
				tx.Rollback(ctx)
				return models.Order{}, fmt.Errorf("create assets order: %w", err)
			}
			orderBodyRedisItems.Assets = append(orderBodyRedisItems.Assets, models.OrderAssetRedis{
				ID:          asset.ID,
				OrderItemID: asset.OrderItemID,
				AssetID:     asset.AssetID,
				StorageKey:  asset.StorageKey,
				Mime:        asset.Mime,
				SizeBytes:   asset.SizeBytes,
			})
		}

		reqOrderBodyRedis.Items = append(reqOrderBodyRedis.Items, orderBodyRedisItems)
	}

	BodyJson, err := json.Marshal(reqOrderBodyRedis)
	if err != nil {
		tx.Rollback(ctx)
		return models.Order{}, fmt.Errorf("Marshal JSON: %w", err)
	}

	err = r.redis.Set(ctx, fmt.Sprintf("%s", Order.ID.String()), BodyJson, 30*24*time.Hour).Err()
	if err != nil {
		tx.Rollback(ctx)
		return models.Order{}, fmt.Errorf("Writer in Redis: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return models.Order{}, fmt.Errorf("commit transaction: %w", err)
	}

	return Order, nil
}
