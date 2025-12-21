# editor-back/Dockerfile

FROM golang:1.25.3 AS builder
WORKDIR /app
# модули
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server/
FROM alpine:3.19
WORKDIR /app

COPY --from=builder /app/server .

ENV PORT=8080
EXPOSE 8080

CMD ["./server"]