package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/Aidajy111/editor-dev/editor-back/internal/db"
	"github.com/Aidajy111/editor-dev/editor-back/internal/http/handlers"
	"github.com/Aidajy111/editor-dev/editor-back/internal/http/middleware"
	"github.com/Aidajy111/editor-dev/editor-back/internal/repository"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	сtx := context.Background()
	dsn := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	if dsn == " " || jwtSecret == " " {
		log.Fatal("DATABASE_URL and JWT_SECRET are required")
	}

	pool, err := db.NewPool(сtx, dsn)
	if err != nil {
		log.Fatal("Ошибка конфигурации пула: ", err)
	}

	defer pool.Close()

	usersRepo := repository.NewUserRepo(pool)
	authH := &handlers.AuthHandler{Users: usersRepo, JWTSecret: jwtSecret}

	mux := http.NewServeMux()

	// публичные ручки
	mux.HandleFunc("/api/auth/register", authH.Register)
	mux.HandleFunc("/api/auth/login", authH.Login)

	// пример защищённой ручки
	protected := http.NewServeMux()
	protected.HandleFunc("/api/me", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK (authorized)"))
	})
	mux.Handle("/api/me", middleware.RequireAuth(jwtSecret)(protected))

	log.Printf("listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
