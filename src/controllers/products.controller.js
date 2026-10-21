import { ProductDTO } from "../dtos/productDTO.js";
import { productService } from "../utils/main.js";
import { generateMockProducts } from "../utils/mocking.js";
class ProductController {
  mockingPorduct(req, res) {
    return res.json(generateMockProducts(100));
  }
  async renderProduct(req, res, next) {
    try {
      const product = new ProductDTO(
        await productService.getProductById(req.params.pid),
      );
      res.render("product-id-details", {
        title: product.title,
        product,
        cartId: req.session?.user?.cart,
      });
    } catch (err) {
      next(err);
    }
  }
  async renderPaginationProducts(req, res, next) {
    try {
      const { limit, page, query, sort } = req.paginationOptions;
      const paginationProducts = await productService.paginationProduct(
        limit,
        page,
        query,
        sort,
      );
      const user = req.session?.user;
      const listProducts = paginationProducts.docs.map((p) => ({
        ...new ProductDTO(p),
        canBuy:
          !!user?.cart &&
          user.rol !== "admin" &&
          p.owner !== user.email &&
          p.stock > 0 &&
          p.status !== false,
      }));
      res.render("products", {
        title: "Catálogo · CityCode",
        paginationProducts,
        listProducts,
        firstName: user?.firstName,
        cartId: user?.cart,
        filters: req.query,
      });
    } catch (err) {
      next(err);
    }
  }
  async renderRealTime(req, res, next) {
    // Vista histórica conservada; el catálogo REST es la interfaz activa.
    return this.renderPaginationProducts(req, res, next);
  }
  async getPagination(req, res, next) {
    try {
      const { limit, page, query, sort } = req.paginationOptions;
      const result = await productService.paginationProduct(
        limit,
        page,
        query,
        sort,
      );
      return res.json({
        status: "success",
        payload: result.docs.map((p) => new ProductDTO(p)),
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.prevLink,
        nextLink: result.nextLink,
      });
    } catch (err) {
      next(err);
    }
  }
  async getProduct(req, res, next) {
    try {
      res.json({
        status: "success",
        payload: new ProductDTO(
          await productService.getProductById(req.params.pid),
        ),
      });
    } catch (err) {
      next(err);
    }
  }
  async post(req, res, next) {
    try {
      const product = await productService.addProduct(req.product);
      res
        .status(201)
        .json({ status: "success", payload: new ProductDTO(product) });
    } catch (err) {
      if (err.code === 11000) err.status = 409;
      next(err);
    }
  }
  async put(req, res, next) {
    try {
      const source = req.body.campo || req.body;
      const update = Object.fromEntries(
        Object.entries(source).filter(([key]) =>
          [
            "title",
            "description",
            "price",
            "stock",
            "thumbnails",
            "status",
            "code",
            "category",
          ].includes(key),
        ),
      );
      const product = await productService.updateProduct(
        req.params.pid,
        update,
      );
      res.json({ status: "success", payload: new ProductDTO(product) });
    } catch (err) {
      next(err);
    }
  }
  async delete(req, res, next) {
    try {
      const owner = req.existingProduct?.owner;
      if (owner && owner !== "admin")
        await req.app.locals.sendNotification({
          to: owner,
          subject: "Producto eliminado",
          text:
            "Tu producto " +
            req.existingProduct.title +
            " fue eliminado de CityCode.",
        });
      await productService.deleteProduct(req.params.pid);
      res.json({ status: "success", msg: "Product deleted" });
    } catch (err) {
      next(err);
    }
  }
}
export const productController = new ProductController();
