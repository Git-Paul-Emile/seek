import 'dotenv/config';
import { prisma } from '../src/config/database.js';
import * as BienService from '../src/services/bien.service.js';
const id = '241e05f3-28df-47e5-a7e1-18194f0492d5';
if (await prisma.bien.findUnique({ where: { id }, select: { id: true } })) await BienService.adminDeleteBien(id);
console.log('annonce de test supprimée :', (await prisma.bien.findUnique({ where: { id } })) === null);
await prisma.$disconnect();
