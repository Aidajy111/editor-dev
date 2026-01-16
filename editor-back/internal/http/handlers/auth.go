package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/Aidajy111/editor-dev/editor-back/internal/auth"
	"github.com/Aidajy111/editor-dev/editor-back/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	Users     *repository.UserRepo
	JWTSecret string
}

type authReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResp struct {
	Token string   `json:"token"`
	User  UserInfo `json:"user"`
}

type UserInfo struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
	Role  string    `json:"role"`
}

// Register создает нового пользователя
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Вызов Register")
	var req authReq

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// Валидация
	if req.Email == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}
	if len(req.Password) < 6 {
		http.Error(w, "password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "failed to hash password", http.StatusInternalServerError)
		return
	}

	// Создание пользователя
	u, err := h.Users.Create(r.Context(), req.Email, string(hash))
	if err != nil {
		if err == repository.ErrEmailTaken {
			http.Error(w, "email already registered", http.StatusConflict)
			return
		}
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	// Генерация токена
	token, err := auth.NewToken(h.JWTSecret, u.ID, u.Role)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(authResp{
		Token: token,
		User: UserInfo{
			ID:    u.ID,
			Email: u.Email,
			Role:  u.Role,
		},
	})
}

// Login аутентифицирует пользователя
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Вызов AuthHandler")
	var req authReq

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// Валидация
	if req.Email == "" || req.Password == "" {
		http.Error(w, "email and password are required", http.StatusBadRequest)
		return
	}

	u, err := h.Users.GetByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	// Генерация токена
	token, err := auth.NewToken(h.JWTSecret, u.ID, u.Role)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(authResp{
		Token: token,
		User: UserInfo{
			ID:    u.ID,
			Email: u.Email,
			Role:  u.Role,
		},
	})
}
