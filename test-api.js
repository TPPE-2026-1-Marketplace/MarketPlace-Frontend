const loginRes = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@smoke.com', senha: 'admin123' })
});
const loginBody = await loginRes.json();
const token = loginBody.access_token;
console.log("Token:", token ? "Got token" : "Failed");

const prodRes = await fetch('http://localhost:3001/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    titulo: "Test Product",
    sku: "TEST-002",
    preco_base: 100,
    descricao: "Test",
    destaque: false
  })
});
const prodBody = await prodRes.json();
console.log("Product status:", prodRes.status);
console.log("Product body:", prodBody);

const idProduto = prodBody.idProduto || prodBody.id;
if (!idProduto) process.exit(1);

const varRes = await fetch('http://localhost:3001/api/product-variants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    idProduto: idProduto,
    codigo_sku: "TEST-002-UNICO",
    preco_variante: 100,
    ativo: true,
    cor: "Único",
    tamanho: "U"
  })
});
console.log("Variant status:", varRes.status);
console.log("Variant body:", await varRes.json());
