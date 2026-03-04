import debug from "debug";
import { readFileSync } from "fs";
import mongoose, { MongooseOptions } from "mongoose";

const log: debug.IDebugger = debug("app:mongoose-service");

interface ConnectionStringParts {
    username: string;
    password: string;
    host: string;
    port: string;
    database: string;
    urlParams?: string;
}

class MongooseService {
    private count = 0;
    private mongooseOptions: MongooseOptions = {
        // strictQuery: true,
    };
    private maxRetries = 5;
    private collectionsToCheck = ["users", "credentials"];
    private connectionString: string;

    constructor() {
        this.connectionString = this.tryCreateConnectionString();

        this.connectWithRetry();
    }

    public getMongoose() {
        return mongoose;
    }

    public connectWithRetry = () => {
        console.log("Attempting MongoDB connection (will retry if needed)");
        mongoose
            .set("strictQuery", true)
            .connect(
                this.connectionString,
                this.mongooseOptions
            )
            .then(async () => {
                console.log("MongoDB is connected");
                const db = mongoose.connection.db;
                if (!db) {
                    throw new Error("Fatal error: Unexpected error, `db` is undefined.");
                }
                const collections = await db.listCollections().toArray();
                const existingCollections = collections.map((c) => c.name);
                const missingCollections = this.collectionsToCheck.filter(
                    (c) => !existingCollections.includes(c)
                );
                if (missingCollections.length !== 0) {
                    throw new Error(
                        `Fatal error: Missing required collections in the database: ${missingCollections.join(
                            ", "
                        )}`
                    );
                }
            })
            .catch((err: unknown) => {
                const retrySeconds = 5;
                console.log(
                    `MongoDB connection unsuccessful (retry #${++this
                        .count} of ${this.maxRetries
                    } after ${retrySeconds} seconds):`,
                    err
                );
                if (this.count < this.maxRetries) {
                    setTimeout(this.connectWithRetry, retrySeconds * 1000);
                } else {
                    throw new Error(
                        "Fatal error: Failed to connect to MongoDB"
                    );
                }
            });
    }

    private tryCreateConnectionString(db_host = "localhost", db_port = 27017, db_name = "sales-csm"): string {
        let dbUsername: string | undefined;
        let dbPassword: string | undefined;
        if (typeof process.env.DB_CONNECTION_STRING === "string") {
            if (process.env.DB_CONNECTION_STRING.startsWith("mongodb://localhost:27017/sales-csm")) {
                console.log(`Connecting to localhost: at 'mongodb://localhost:27017/sales-csm'`);
                return process.env.DB_CONNECTION_STRING;
            }
            return this.tryValidateConnectionString(process.env.DB_CONNECTION_STRING);
        } else if (typeof process.env.DB_USERNAME === "string" && typeof process.env.DB_PASSWORD === "string" && !/undefined/.test(`${process.env.DB_USERNAME}${process.env.DB_USERNAME}`)) {
            dbUsername = process.env.DB_USERNAME;
            dbPassword = process.env.DB_PASSWORD;
        } else if (typeof process.env.DB_USERNAME_FILE === "string" && typeof process.env.DB_PASSWORD_FILE === "string") {
            dbUsername = readFileSync(process.env.DB_USERNAME_FILE, "utf-8");
            dbPassword = readFileSync(process.env.DB_PASSWORD_FILE, "utf-8");
        } else {
            throw new Error("Missing 'DB_CONNECTION_STRING' and could not find fallback values: 'DB_USERNAME[_FILE]' or 'DB_PASSWORD[_FILE]'");
        }
        const candidateConnectionString = `mongodb://${dbUsername}:${dbPassword}@${process.env.DB_HOST ?? db_host}:${process.env.DB_PORT ?? db_port}/${db_name}?authMechanism=DEFAULT&authSource=admin`;
        return this.tryValidateConnectionString(candidateConnectionString);
    }

    private tryValidateConnectionString(connectionString: string): string {
        console.log("Validating MongoDB Connection string");

        // We allow for optional values to gain more factual error checking
        const connectionStringPattern = /^mongodb:\/\/([^:]+)?:([^@]+)?@([^:]+)?:(\d+)\/([^/?]+)(\/?(\?.+))?$/;

        const match = connectionString.match(connectionStringPattern);

        if (match) {
            // const [_, ...matches] = match;
            const matches = match.slice(1) as [string, string, string, string, string, ...string[]];
            const [username, password, host, port, database, ...urlParams] = matches;
            // const [username, password, host, port, database, ...urlParams] = matches as const;

            const connectionParts: ConnectionStringParts = {
                username,
                password,
                host,
                port,
                database,
            };

            if (urlParams.length > 0) {
                connectionParts.urlParams = urlParams.join("");
            }

            // Check for unexpected 'undefined' strings
            const unexpectedUndefinedElements = Object.keys(connectionParts)
                .filter((key) => `${connectionParts[key as keyof ConnectionStringParts]}` === "undefined");

            if (unexpectedUndefinedElements.length > 0) {
                throw new Error(`Unexpected 'undefined' found in the following elements: ${unexpectedUndefinedElements.join(", ")}`);
            }
        } else {
            throw new Error("Invalid connection string format.");
        }
        return connectionString;
    }
}

export default new MongooseService();
