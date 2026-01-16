package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/Aidajy111/editor-dev/editor-back/internal/models"
	"github.com/google/uuid"
)

type OrderHandler struct {
	UploadDir string
}

type CreateOrderRequest struct {
	Customer models.CustomerDTO
	items    []models.ItemDTO
}

var (
	DirStat string = "/uploads/orders/"
)

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
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
	// Создаем файл
	for fileName, fileDate := range files.File {
		if !strings.HasPrefix(fileName, "preview_") && !strings.HasPrefix(fileName, "asset_") {
			continue
		}

		for _, oneFile := range fileDate {
			f, err := oneFile.Open()
			if err != nil {
				fmt.Printf("Error open file: %v\n", err)
				http.Error(w, "Error open file ", http.StatusBadRequest)
				return
			}

			if strings.HasPrefix(fileName, "preview_") {
				// создаем картинки preview_....jpg
				//получаем id превью удаляя префикс в начале и в конце

				if err := os.MkdirAll(DirStat+OrderId+"/preview/", 0755); err != nil {
					fmt.Printf("Error create directory: %v\n", err)
					http.Error(w, "Error create directory", http.StatusBadRequest)
				}

				file, err := os.Create(DirStat + OrderId + "/preview/" + fileName + filepath.Ext(oneFile.Filename))
				if err != nil {
					fmt.Printf("Error create file %s: %v\n", fileName, err)
					http.Error(w, "Error create file", http.StatusBadRequest)
					return
				}
				file.Close()

				if _, err := io.Copy(file, f); err != nil {
					fmt.Printf("Error copy file %s: %v\n", fileName, err)
					http.Error(w, "Error copy file", http.StatusBadRequest)
				}
			} else if strings.HasPrefix(fileName, "asset_") {
				// создаем картинки asset_....png

				if err := os.MkdirAll(DirStat+OrderId+"/asset/", 0755); err != nil {
					fmt.Printf("Error create directory asset: %v\n", err)
					http.Error(w, "Error create directory asset", http.StatusBadRequest)
				}

				file, err := os.Create(DirStat + OrderId + "/asset/" + fileName + filepath.Ext(oneFile.Filename))
				if err != nil {
					fmt.Printf("Error create file %s asset: %v\n", fileName, err)
					http.Error(w, "Error create file asset", http.StatusBadRequest)
					return
				}
				file.Close()

				if _, err := io.Copy(file, f); err != nil {
					fmt.Printf("Error copy file %s asset: %v\n", fileName, err)
					http.Error(w, "Error copy file asset", http.StatusBadRequest)
				}
			}
			f.Close()
		}
	}
	// ...
	// Далее сохранить спарсенные данные в бд. Сделать insert запрос где будут
	// относительные ссылки и другие данные с уже готовых структур в modules ...
	// ...
	// 7. Отправляем ответ
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Order created",
		"orderId": 123,
	})
}
