package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type OrderHandler struct {
	UploadDir string
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

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

	// 3. Парсим JSON
	var requestData struct {
		Model          interface{}   `json:"model"`
		Elements       []interface{} `json:"elements"`
		BgColor        string        `json:"bgColor"`
		BgEnabled      bool          `json:"bgEnabled"`
		PreviewAssetId string        `json:"previewAssetId"`
	}

	if err := json.Unmarshal([]byte(payload), &requestData); err != nil {
		fmt.Printf("JSON parse error: %v\n", err)
		http.Error(w, "failed to parse form", http.StatusBadRequest)
		return
	}

	// 4. Получаем файл preview (если есть)
	file, header, err := r.FormFile("preview")
	var previewPath string

	if err == nil {
		defer file.Close()

		// Сохраняем файл
		previewPath = filepath.Join(h.UploadDir, header.Filename)
		dst, err := os.Create(previewPath)
		if err != nil {
			fmt.Printf("File create error: %v\n", err)
			http.Error(w, "failed to save file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		// Копируем файл
		if _, err := io.Copy(dst, file); err != nil {
			fmt.Printf("File copy error: %v\n", err)
			http.Error(w, "failed to save file", http.StatusInternalServerError)
			return
		}

		fmt.Printf("Preview saved: %s (%d bytes)\n", previewPath, header.Size)
	}

	// 5. Выводим данные
	fmt.Printf("Parsed data:\n")
	fmt.Printf("- BgColor: %s\n", requestData.BgColor)
	fmt.Printf("- BgEnabled: %v\n", requestData.BgEnabled)
	fmt.Printf("- Elements count: %d\n", len(requestData.Elements))
	fmt.Printf("- PreviewAssetId: %s\n", requestData.PreviewAssetId)

	// 7. Отправляем ответ
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Order created",
		"orderId": 123,
	})
}
