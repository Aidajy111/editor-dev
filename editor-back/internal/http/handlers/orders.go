package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Aidajy111/editor-dev/editor-back/internal/models"
	"github.com/Aidajy111/editor-dev/editor-back/internal/repository"
	"github.com/google/uuid"
)

type OrderHandler struct {
	Order     *repository.OrderRepo
	UploadDir string
}

type CreateOrderRequest struct {
	Customer models.CustomerDTO
	Items    []models.ItemDTO
}

var (
	DirStat string = "/uploads/orders/"
)

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	previewKeys := map[string]string{} // itemID -> preview path
	assetKeys := map[string]string{}   // assetID -> asset path

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	OrderId := uuid.New().String()

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		fmt.Printf("ParseMultipartForm error: %v\n", err)
		http.Error(w, "failed to parse form", http.StatusBadRequest)
		return
	}
	// 2. Получаем JSON данные из поля "payload"

	payload := r.FormValue("payload")
	fmt.Println("=== INCOMING ORDER REQUEST ===")
	fmt.Printf("Payload: %s\n", payload)
	fmt.Println("=============================")

	// Парсим JSON
	var req CreateOrderRequest

	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		fmt.Printf("JSON parse CreateOrderRequest error: %v\n", err)
		http.Error(w, "failed to parse form", http.StatusBadRequest)
		return
	}

	files := r.MultipartForm

	for _, fileList := range files.File {
		for _, oneFile := range fileList {
			f, err := oneFile.Open()
			if err != nil {
				http.Error(w, "Error open file", http.StatusBadRequest)
				return
			}

			filename := oneFile.Filename // тут лежит preview_... или asset_...
			switch {
			case strings.HasPrefix(filename, "preview_"):
				if err := os.MkdirAll(DirStat+OrderId+"/preview/", 0755); err != nil {
					http.Error(w, "Error create directory", http.StatusBadRequest)
					return
				}

				dstPath := DirStat + OrderId + "/preview/" + filename
				out, err := os.Create(dstPath)
				if err != nil {
					http.Error(w, "Error create file", http.StatusBadRequest)
					return
				}

				if _, err := io.Copy(out, f); err != nil {
					http.Error(w, "Error copy file", http.StatusBadRequest)
					out.Close()
					return
				}
				out.Close()

				itemID := strings.TrimPrefix(strings.TrimSuffix(filename, filepath.Ext(filename)), "preview_")
				previewKeys[itemID] = dstPath

			case strings.HasPrefix(filename, "asset_"):
				if err := os.MkdirAll(DirStat+OrderId+"/asset/", 0755); err != nil {
					http.Error(w, "Error create directory asset", http.StatusBadRequest)
					return
				}

				dstPath := DirStat + OrderId + "/asset/" + filename
				out, err := os.Create(dstPath)
				if err != nil {
					http.Error(w, "Error create file asset", http.StatusBadRequest)
					return
				}

				if _, err := io.Copy(out, f); err != nil {
					http.Error(w, "Error copy file asset", http.StatusBadRequest)
					out.Close()
					return
				}
				out.Close()

				assetID := strings.TrimPrefix(strings.TrimSuffix(filename, filepath.Ext(filename)), "asset_")
				assetKeys[assetID] = dstPath
			}

			f.Close()
		}
	}
	// ...
	// Далее сохранить спарсенные данные в бд. Сделать insert запрос где будут
	// относительные ссылки и другие данные с уже готовых структур в modules ...
	// ...

	ctx := r.Context()

	order := models.Order{
		ID:              uuid.New(),
		CustomerName:    req.Customer.Name,
		CustomerEmail:   req.Customer.Email,
		CustomerPhone:   req.Customer.Phone,
		CustomerComment: req.Customer.Comment,
		Status:          "new",
		CreatedAt:       time.Now(),
	}

	items := make([]models.OrderItems, 0, len(req.Items))
	assets := make([]models.OrderAsset, 0)

	for _, item := range req.Items {
		itemID := uuid.New()

		previewPath := previewKeys[item.ID]
		designJSON, _ := json.Marshal(item.Elements)

		items = append(items, models.OrderItems{
			ID:             itemID,
			OrderID:        order.ID,
			ModelID:        item.Model.ID,
			PhoneModelName: item.Model.Name,
			DesignJSON:     designJSON,
			PreviewKey:     previewPath,
			CreatedAt:      time.Now(),
		})

		for _, el := range item.Elements {
			if el.Type != "image" || el.AssetID == "" {
				continue
			}

			assetPath := assetKeys[el.AssetID]
			assets = append(assets, models.OrderAsset{
				ID:          uuid.New(),
				OrderItemID: itemID,
				AssetID:     el.AssetID,
				StorageKey:  assetPath,
				Mime:        "image/*",
				SizeBytes:   0,
			})
		}
	}

	savedOrder, err := h.Order.CreateOrder(ctx, order, items, assets)
	if err != nil {
		http.Error(w, "failed to create order", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Order created",
		"orderId": savedOrder.ID,
	})
}
