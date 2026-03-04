import { readFile } from "fs/promises";

class AuthService {
	public async getJWTSecret(): Promise<string> {
		let jwtSecret: string | undefined = process.env.JWT_SECRET;
		const jwtSecretFile: string | undefined = process.env.JWT_SECRET_FILE;
		if (!jwtSecret && jwtSecretFile) {
			jwtSecret = await readFile(jwtSecretFile, "utf-8");
		}
		if (!jwtSecret || jwtSecret.trim().length < 16) {
			throw new Error("Invalid JWT Secret, either missing or invalid size");
		}
		return jwtSecret.trim();
	}
}
export default new AuthService();
