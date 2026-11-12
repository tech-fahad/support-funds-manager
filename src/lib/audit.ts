import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function logAction(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: { actorId, action, entity, entityId, details },
  })
}
