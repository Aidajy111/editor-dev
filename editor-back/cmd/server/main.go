package main

import (
	"context"
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
		port = "8080"
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

//func NewSqlxConn(dbType string, dsn string, migrate bool) (*sqlx.DB, error) {
//	switch dbType {
//	case "sqlite":
//		db, err := sqlx.Connect("sqlite", dsn)
//		if err != nil {
//			return nil, errors.Wrap(err, "can't connect to db")
//		}
//
//		// Вызываем миграции для SQLite
//		if migrate == false {
//			fmt.Println("Not migrations")
//		} else {
//			err = RunMainMigrationSqlite(db, dsn)
//
//			if err != nil {
//				return nil, errors.Wrap(err, "migration failed")
//			}
//		}
//
//		if err = db.Ping(); err != nil {
//			return nil, errors.Wrap(err, "can't ping db")
//		}
//		return db, nil
//	case "postgres":
//		// dsn - оработать правильно для postgress так как сейчас он принимает путь до app.db
//		db, err := sqlx.Connect("postgres", dsn)
//		if err != nil {
//			return nil, errors.Wrap(err, "can't connect to db")
//		}
//
//		if err = db.Ping(); err != nil {
//			return nil, errors.Wrap(err, "can't ping db")
//		}
//		return db, nil
//	default:
//		return nil, fmt.Errorf("unsupported DB_TYPE: %s", dbType)
//	}
//}
//
//// RunMainMigrationSqlite - старт для миграции Sqlite
//func RunMainMigrationSqlite(db *sqlx.DB, dsn string) error {
//	// Используем database/sql драйвер для миграций
//	driver, err := sqlite.WithInstance(db.DB, &sqlite.Config{})
//	if err != nil {
//		return fmt.Errorf("failed to create sqlite driver: %v", err)
//	}
//
//	m, err := migrate.NewWithDatabaseInstance(
//		"file://internal/repository/sqlite/migrations",
//		"sqlite",
//		driver,
//	)
//	if err != nil {
//		return fmt.Errorf("error creating the migrator: %v", err)
//	}
//
//	// Применяем миграции
//	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
//		return fmt.Errorf("migration application error: %v", err)
//	}
//
//	log.Println("Migrations applied successfully")
//	return nil
//}
