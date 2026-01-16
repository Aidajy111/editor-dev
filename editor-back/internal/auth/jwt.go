package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID uuid.UUID `json:"uid"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

// Константы для настройки токена
const (
	DefaultTokenExpiration = 7 * 24 * time.Hour
	Issuer                 = "editor-back"
)

var (
	ErrInvalidToken      = errors.New("invalid token")
	ErrUnexpectedSigning = errors.New("unexpected signing method")
	ErrTokenExpired      = errors.New("token expired")
)

// NewToken создает новый JWT токен
func NewToken(secret string, userId uuid.UUID, role string) (string, error) {
	claims := Claims{
		UserID: userId,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(DefaultTokenExpiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    Issuer,
			Subject:   userId.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Подписываем токен
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return signedToken, nil
}

// ParseToken проверяет и парсит JWT токен
func ParseToken(secret, tokenStr string) (*Claims, error) {
	// Парсим токен с claims
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrUnexpectedSigning
		}
		return []byte(secret), nil
	})

	if err != nil {
		// Проверяем конкретные ошибки
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	// Проверяем валидность токена и тип claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	if issuer, err := claims.GetIssuer(); err == nil && issuer != Issuer {
		return nil, fmt.Errorf("%w: invalid issuer", ErrInvalidToken)
	}

	return claims, nil
}
