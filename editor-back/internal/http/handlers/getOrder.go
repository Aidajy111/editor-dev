package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()

	vars := mux.Vars(r)
	orderId, exists := vars["id"]
	if !exists {
		http.Error(w, "ID not provided", http.StatusBadRequest)
		return
	}

	order, err := h.Order.GetOrder(ctx, orderId)
	if err != nil {
		http.Error(w, "failed to create order", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}
