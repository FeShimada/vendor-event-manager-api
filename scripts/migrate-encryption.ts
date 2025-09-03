import { PrismaClient } from '@prisma/client';
import { CryptoService } from '../src/common/services/crypto.service';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const cryptoService = new CryptoService();

async function migrateExistingData() {
    try {
        console.log('🚀 Iniciando migração de dados para criptografia...');

        const accounts = await prisma.mercadoPagoAccount.findMany();

        if (accounts.length === 0) {
            console.log('✅ Nenhuma conta encontrada para migrar');
            return;
        }

        console.log(`📊 Encontradas ${accounts.length} contas para migrar`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const account of accounts) {
            try {
                if (cryptoService.isEncrypted(account.accessToken)) {
                    console.log(`⏭️  Conta ${account.id} já está criptografada, pulando...`);
                    skippedCount++;
                    continue;
                }

                console.log(`🔐 Criptografando conta ${account.id}...`);

                const encryptedAccessToken = cryptoService.encrypt(account.accessToken);
                const encryptedRefreshToken = cryptoService.encrypt(account.refreshToken);
                const encryptedPublicKey = account.publicKey
                    ? cryptoService.encrypt(account.publicKey)
                    : null;

                await prisma.mercadoPagoAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken: encryptedAccessToken,
                        refreshToken: encryptedRefreshToken,
                        publicKey: encryptedPublicKey,
                    },
                });

                console.log(`✅ Conta ${account.id} criptografada com sucesso`);
                migratedCount++;

            } catch (error) {
                console.error(`❌ Erro ao migrar conta ${account.id}:`, error);
            }
        }

        console.log('\n📈 Resumo da migração:');
        console.log(`   ✅ Migradas: ${migratedCount}`);
        console.log(`   ⏭️  Puladas: ${skippedCount}`);
        console.log(`   📊 Total: ${accounts.length}`);

        if (migratedCount > 0) {
            console.log('\n🎉 Migração concluída com sucesso!');
        } else {
            console.log('\nℹ️  Nenhum dado foi migrado');
        }

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    migrateExistingData();
}

export { migrateExistingData }; 