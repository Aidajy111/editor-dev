package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/Aidajy111/editor-dev/editor-back/internal/auth"
)

type ctxKey string

const (
	CtxUserID ctxKey = "uid"
	CtxRole   ctxKey = "role"
)

func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			h := r.Header.Get("Authorization")
			if !strings.HasPrefix(h, "Bearer ") {
				http.Error(w, "missing token", http.StatusUnauthorized)
				return
			}
			tokenStr := strings.TrimPrefix(h, "Bearer ")

			claims, err := auth.ParseToken(jwtSecret, tokenStr)
			if err != nil {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}
			
			ctx := context.WithValue(r.Context(), CtxUserID, claims.UserID)
			ctx = context.WithValue(ctx, CtxRole, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
