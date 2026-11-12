import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { VoteButton } from "@/components/governance/vote-button"

export default async function VotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const member = await prisma.member.findUnique({ where: { userId: user.id } })
  if (!member) redirect("/onboarding")

  const canVote = member.role !== "office_staff"

  const proposals = await prisma.proposal.findMany({
    orderBy: { proposedAt: "desc" },
    include: {
      votes: true,
      proposedBy: { select: { name: true } },
    },
  })

  const totalActiveMembers = await prisma.member.count({
    where: { role: { in: ["member", "trustee"] } },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Governance</h1>

      {proposals.length === 0 && (
        <p className="text-sm text-muted-foreground">No proposals yet.</p>
      )}

      {proposals.map((proposal) => {
        const myVote = proposal.votes.find((v: { memberId: string }) => v.memberId === member.id)
        const yesCount = proposal.votes.filter((v: { vote: string }) => v.vote === "yes").length
        const noCount = proposal.votes.filter((v: { vote: string }) => v.vote === "no").length
        const isOpen = proposal.status === "open"
        const isPast = new Date(proposal.votingDeadline) < new Date()

        const threshold = proposal.type === "rule_change"
          ? Math.ceil(totalActiveMembers * 2 / 3)
          : null

        return (
          <Card key={proposal.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{proposal.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Proposed by {proposal.proposedBy.name} · {formatDate(proposal.proposedAt)}
                  </p>
                </div>
                <Badge variant={
                  proposal.status === "open" ? "default" :
                  proposal.status === "passed" ? "default" : "secondary"
                }>
                  {proposal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{proposal.description}</p>

              <div className="flex gap-6 text-sm">
                <span className="text-green-700 font-medium">YES: {yesCount}</span>
                <span className="text-destructive font-medium">NO: {noCount}</span>
                {threshold && (
                  <span className="text-muted-foreground">Need {threshold} YES to pass</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Deadline: {formatDate(proposal.votingDeadline)}{isPast ? " (closed)" : ""}</span>
                <Badge variant="outline" className="capitalize">
                  {proposal.type.replace(/_/g, " ")}
                </Badge>
              </div>

              {isOpen && !isPast && canVote && (
                <VoteButton
                  proposalId={proposal.id}
                  memberId={member.id}
                  currentVote={myVote?.vote ?? null}
                />
              )}

              {myVote && (
                <p className="text-xs text-muted-foreground">
                  You voted: <strong className="capitalize">{myVote.vote}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
