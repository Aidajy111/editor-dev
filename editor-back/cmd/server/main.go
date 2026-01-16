package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Aidajy111/editor-dev/editor-back/internal/db"
	"github.com/Aidajy111/editor-dev/editor-back/internal/http/handlers"
	"github.com/Aidajy111/editor-dev/editor-back/internal/http/middleware"
	"github.com/Aidajy111/editor-dev/editor-back/internal/migrates"
	"github.com/Aidajy111/editor-dev/editor-back/internal/repository"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "7070"
	}

	ctx := context.Background()
	dsn := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	if dsn == "" || jwtSecret == "" {
		log.Fatal("DATABASE_URL and JWT_SECRET are required")
	}
	log.Printf("Using database: %s", dsn)

	// Миграция

	if err := migrates.RunMigrations(dsn); err != nil {
		log.Fatal("Migrations error: ", err)
	}

	// Ждем немного чтобы БД была готова

	time.Sleep(1 * time.Second)

	// подключение к бд
	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		log.Fatal("Ошибка конфигурации пула: ", err)
	}
	defer pool.Close()

	usersRepo := repository.NewUserRepo(pool)
	authH := &handlers.AuthHandler{Users: usersRepo, JWTSecret: jwtSecret}
	uploadDir := "/uploads"
	orderHandler := &handlers.OrderHandler{UploadDir: uploadDir}

	mux := http.NewServeMux()

	// публичные ручки
	mux.HandleFunc("POST /api/auth/register", authH.Register)
	mux.HandleFunc("POST /api/auth/login", authH.Login)
	mux.HandleFunc("POST /api/orders", orderHandler.CreateOrder)

	// Защищенные маршруты
	protected := http.NewServeMux()
	protected.HandleFunc("GET /api/me", func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(middleware.CtxUserID)
		role := r.Context().Value(middleware.CtxRole)

		w.Header().Set("Content-Type", "application/json")
		response := fmt.Sprintf(`{"user_id": "%v", "role": "%s"}`, userID, role)
		w.Write([]byte(response))
	})

	protected.HandleFunc("GET /api/profile", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "Profile endpoint (protected)"}`))
	})

	// Применяем middleware ко всем защищенным маршрутам
	mux.Handle("/api/", middleware.RequireAuth(jwtSecret)(protected))

	// Настройка сервера
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	log.Printf("Server listening on http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}
