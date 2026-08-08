<template>
  <main class="not-found-container">
    <h1>404</h1>
    <p>Trang bạn tìm kiếm không tồn tại.</p>
    <router-link to="/" class="btn-home">Về trang chủ</router-link>
  </main>
</template>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  text-align: center;
}

h1 {
  font-size: 64px;
  font-weight: 700;
  color: #111111;
}

p {
  color: #6b7280;
}

.btn-home {
  background-color: #111111;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
}
</style>
