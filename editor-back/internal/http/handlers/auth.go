package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Aidajy111/editor-dev/editor-back/internal/auth"
	"github.com/Aidajy111/editor-dev/editor-back/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	Users *repository.UserRepo
	JWTSecret string
}

type authReq struct {
	Email string `json:"email"`
	Password string `json:"password"`
}

type authResp struct {
	Token string `json:"token"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req authReq

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == " " || len(req.Password) < 6 {
		http.Error(w, "invalid email/password", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.defaultCost)
	if err != nil {
		http.Error(w, "hash error", http.StatusInternalServerError)
		return
	}

	u, err := h.Users.Create(r.Context(), req.Email, string(hash))
	if != nil {
		if err == repository.ErrEmailTaken {
			http.Error(w, "email already used", http.StatusConflict)
			return
		}
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	token, err := auth.NewToken(h.JWTSecret, u.ID, u.Role)

	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(authResp{Token: token})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req authReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// 1) Достаём пользователя по email
	u, err := h.Users.GetByEmail(r.Context(), req.Email)
	if err != nil {
		// Важно: не говорить “email не найден” — иначе можно угадывать аккаунты
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// 2) Сравниваем пароль с хешем из БД
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	// 3) Выдаём токен
	token, err := auth.NewToken(h.JWTSecret, u.ID, u.Role)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(authResp{Token: token})
}