const loginRes = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@smoke.com', senha: 'admin123' })
});
const loginBody = await loginRes.json();
const token = loginBody.access_token;

const invRes = await fetch('http://localhost:3001/api/inventory/TEST-002-UNICO', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    qtdOnline: 5,
    qtdLojaFisica: 2,
    motivo: "Cadastro inicial",
    tipoMovimentacao: "ajuste"
  })
});
console.log("Inventory status:", invRes.status);
console.log("Inventory body:", await invRes.text());
