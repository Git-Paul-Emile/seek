import { describe, it, expect } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError.js';

describe('AppError', () => {
  it('devrait créer une erreur avec le message par défaut', () => {
    const error = new AppError('Une erreur est survenue');
    expect(error.message).toBe('Une erreur est survenue');
    expect(error.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(error.isOperational).toBe(true);
  });

  it('devrait créer une erreur avec un message et un statusCode personnalisé', () => {
    const error = new AppError('Ressource non trouvée', StatusCodes.NOT_FOUND);
    expect(error.message).toBe('Ressource non trouvée');
    expect(error.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(error.isOperational).toBe(true);
  });

  it('devrait créer une erreur non opérationnelle', () => {
    const error = new AppError('Erreur critique', StatusCodes.INTERNAL_SERVER_ERROR, false);
    expect(error.isOperational).toBe(false);
  });

  it('devrait être une instance de Error', () => {
    const error = new AppError('Test error');
    expect(error).toBeInstanceOf(Error);
  });

  it('devrait avoir le bon nom de classe', () => {
    const error = new AppError('Test error');
    expect(error.name).toBe('AppError');
  });

  it('devrait avoir un prototype correct', () => {
    const error = new AppError('Test error');
    expect(Object.getPrototypeOf(error).constructor.name).toBe('AppError');
  });
});
