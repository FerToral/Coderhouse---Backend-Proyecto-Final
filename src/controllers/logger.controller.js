class LoggerController {
  async loggerLevelsResponse(req, res) {
    req.logger.debug("This is a debug message");
    req.logger.http("This is an HTTP message");
    req.logger.info("This is an information message");
    req.logger.warning("This is a warning message");
    req.logger.error("This is an error message");
    req.logger.fatal("This is a fatal message");
    return res.json({
      status: "success",
      levels: ["debug", "http", "info", "warning", "error", "fatal"],
    });
  }
}

export const loggerController = new LoggerController();
