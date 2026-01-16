package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "123" // пароль для админа

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}

	fmt.Printf("Пароль: %s\n", password)
	fmt.Printf("Хеш:    %s\n", string(hash))
}
