const axios = require('axios').default;
const cheerio = require('cheerio')

const PRODS_PER_PAGE = 24;
const api = axios.create({
  baseURL: 'https://www.cotodigital3.com.ar/sitios/cdigi/',
  timeout: 3000
});

const getPageOffset = pageNumber => (pageNumber - 1) * 24;

const requestCotoData = pageNumber => api.get(`browse?Dy=1&Nf=product.endDate%7CGTEQ+1.6162848E12%7C%7Cproduct.startDate%7CLTEQ+1.6162848E12&No=${getPageOffset(pageNumber)}&Nr=AND%28product.language%3Aespa%C3%B1ol%2Cproduct.sDisp_200%3A1004%2Cproduct.siteId%3ACotoDigital%2COR%28product.siteId%3ACotoDigital%29%29&Nrpp=24&Nty=1&_D%3AidSucursal=+&_D%3AsiteScope=+&atg_store_searchInput=todo&idSucursal=200&siteScope=ok`);

const getCotoInfo = async () => {
  // Buscar html pagina 1
  let response = await requestCotoData(1);
  let $ = cheerio.load(response.data);

  // Nro de paginas
  const totalProducts = $('#resultsCount').text();
  const numberOfPages = Math.ceil(totalProducts / PRODS_PER_PAGE);


  // codigo para una pag, mover
  const pageProducts = $('[id^="li_prod"]');
  const productSKUs = Object.values(pageProducts)
    .map((product, index) => index < PRODS_PER_PAGE
      ? product.attribs.id
      : null)
    .filter(e => !!e)
    .map(id => id.replace('li_prod', ''));

  const products = {};
  const getPrice = sku =>  ($(`#divProductAddCart_sku${sku} > div.info_discount > span.atg_store_productPrice > span.atg_store_newPrice`).text() || $(`#divProductAddCart_sku${sku}`).text()).match(/(\$\d?\.?\d+\,?\d{1,2})/g)[0];
  const getDescription = sku => $(`#descrip_full_sku${sku}`).text();
  productSKUs.forEach(sku => {
      const product = {
        price: getPrice(sku),
        sku,
        description: getDescription(sku)
      }
      products[sku] = product;
    });
  console.log(products);
  
  // Buscar todos los skus
  for (i = 2; i <= numberOfPages; i++) {
    // response = await requestCotoData(i);
    // $ = cheerio.load(response.data);

  }
  // Por cada SKU:
  // Buscar '#divProductAddCart_sku${sku}' para el precio
  // Buscar '#descrip_container_sku${00463629}


  // console.log($('.atg_store_productPrice').text());
}

getCotoInfo();
