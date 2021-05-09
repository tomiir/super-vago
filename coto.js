const axios = require('axios').default;
const cheerio = require('cheerio')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cliProgress = require('cli-progress');

const PRODS_PER_PAGE = 24;
const api = axios.create({
  baseURL: 'https://www.cotodigital3.com.ar/sitios/cdigi/',
  timeout: 30000
});

const getPageOffset = pageNumber => (pageNumber - 1) * 24;

const requestCotoData = pageNumber => api.get(`browse?Dy=1&Nf=product.endDate%7CGTEQ+1.6162848E12%7C%7Cproduct.startDate%7CLTEQ+1.6162848E12&No=${getPageOffset(pageNumber)}&Nr=AND%28product.language%3Aespa%C3%B1ol%2Cproduct.sDisp_200%3A1004%2Cproduct.siteId%3ACotoDigital%2COR%28product.siteId%3ACotoDigital%29%29&Nrpp=24&Nty=1&_D%3AidSucursal=+&_D%3AsiteScope=+&atg_store_searchInput=todo&idSucursal=200&siteScope=ok`);

const getCotoInfo = async () => {
  console.log('Empezando extraccion de datos...\n');
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // Buscar html pagina 1
  let response = await requestCotoData(1);
  let $ = cheerio.load(response.data);
  const date = new Date();
  const formatedDate = date.getDate() + "-"+ date.getMonth()+ "-" + date.getFullYear();
  const fileName = `Listado Coto [${formatedDate}].csv`;
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      {id: 'sku', title: 'SKU'},
      {id: 'description', title: 'Descripción del producto'},
      {id: 'price', title: 'Precio en $'},
    ]
  });

  // Nro de paginas
  const totalProducts = $('#resultsCount').text();
  console.log(`Total de productos a obtener: ${totalProducts}\n`);
  progressBar.start(totalProducts, 0);
  const numberOfPages = Math.ceil(totalProducts / PRODS_PER_PAGE);
  // Uncomment if needed
  // const numberOfPages = 5;

  // codigo para una pag, mover
  const products = [];
  // Buscar todos los skus de cada producto y luego descripcion y precio de los mismos.
  for (i = 2; i <= numberOfPages; i++) {
    try {
    response = await requestCotoData(i);
    $ = cheerio.load(response.data);

    const pageProducts = $('[id^="li_prod"]') || {};
    const productSKUs = Object.values(pageProducts)
      .map((product, index) => index < PRODS_PER_PAGE
        ? product?.attribs?.id
        : null)
      .filter(e => !!e)
      .map(id => id?.replace('li_prod', ''));
  
    const getPrice = sku =>  ($(`#divProductAddCart_sku${sku} > div.info_discount > span.atg_store_productPrice > span.atg_store_newPrice`).text() || $(`#divProductAddCart_sku${sku}`).text()).match(/(\$\d?\.?\d+\,?\d{1,2})/g)?.[0];
    const getDescription = sku => $(`#descrip_full_sku${sku}`)?.text();
    productSKUs.forEach(sku => {
        const product = {
          sku,
          price: getPrice(sku),
          description: getDescription(sku)
        }
        products.push(product);
        progressBar.update(products.length);
      });
    } catch {
      console.log('\x1b[32m%s\x1b[0m','Hubo un error de ejecucion, vuelva a intentarlo');
    }
  }
    console.log(products);
    csvWriter
      .writeRecords(products)
      .then(()=> {
        progressBar.stop();
        console.clear();
        console.log('\x1b[32m%s\x1b[0m', `El archivo ha sido creado con exito\nNombre del archivo: ${fileName}\n`);
      });
      
}

module.exports = getCotoInfo;

// Allow use of default import syntax in TypeScript
module.exports.default = getCotoInfo;

