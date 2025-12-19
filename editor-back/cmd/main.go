package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/editor-back/internal/db"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	сtx := context.Background()
	dsn := os.Getenv("DATABASE_URL")
	pool, err := newPool(ctx, dsn)

	if err != nil {
		log.Fatal("Ошибка конфигурации пула: ", err)
	}

	defer pool.Close()
	fmt.Println("Пул соединений успешно настроен")

	for i := 0; i < 1000; I++ {
		go func(i int) {

		}
	}

	mux := http.NewServeMux()

	mux.HandleFunc()

	log.Printf("Server started on :%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
