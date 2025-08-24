#!/bin/bash

if ! docker info > /dev/null 2>&1; then
  echo "🔄 Docker chưa chạy, mở Docker Desktop..."
  open -a "Docker"

  while ! docker info > /dev/null 2>&1; do
    sleep 2
    echo "⏳ Đang chờ Docker khởi động..."
  done
fi

echo "✅ Docker đã sẵn sàng!"