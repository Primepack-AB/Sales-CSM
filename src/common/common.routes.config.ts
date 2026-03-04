import express from "express";
export abstract class CommonRoutesConfig {
  public app: express.Application;
  public name: string;

  constructor(app: express.Application, name: string) {
    this.app = app;
    this.name = name;
    this.configureRoutes();
  }

  public getName(): string {
    return this.name;
  }

  public abstract configureRoutes(): express.Application;
}
