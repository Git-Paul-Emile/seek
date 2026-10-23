import { StatusCodes } from "http-status-codes";




/**
* AppError : Classe personnalisée pour les erreurs métier
* Permet de lancer des erreurs avec un code HTTP et un message
*/
export class AppError extends Error {
 constructor(
   public message: string,
   public statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
   public isOperational: boolean = true
 ) {
   super(message);
   this.name = this.constructor.name;
   Object.setPrototypeOf(this, AppError.prototype);
 }
}
