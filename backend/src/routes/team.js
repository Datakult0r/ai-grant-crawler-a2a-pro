import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET /api/team - Get team members and activity
router.get("/", async (req, res) => {
  try {
    // For now, return demo team data since customers table requires auth
    // In production, this would fetch from customers/users table
    
    // Fetch proposals to generate activity data
    const { data: proposals, error: proposalsError } = await supabase
      .from("proposals")
      .select(`
        id,
        status,
        mode,
        created_at,
        grants (name)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (proposalsError) {
      console.error("Error fetching proposals for activity:", proposalsError);
    }

    // Demo team members (would come from customers table in production)
    const teamMembers = [
      {
        id: "1",
        name: "Ana Silva",
        role: "Principal Investigator",
        initials: "AS",
        color: "bg-primary",
        assigned: 0,
        email: "ana.silva@example.com",
      },
      {
        id: "2",
        name: "João Santos",
        role: "Medical Expert",
        initials: "JS",
        color: "bg-secondary",
        assigned: 0,
        email: "joao.santos@example.com",
      },
      {
        id: "3",
        name: "Maria Costa",
        role: "AI Researcher",
        initials: "MC",
        color: "bg-accent",
        assigned: 0,
        email: "maria.costa@example.com",
      },
      {
        id: "4",
        name: "Pedro Alves",
        role: "Project Manager",
        initials: "PA",
        color: "bg-yellow-500",
        assigned: 0,
        email: "pedro.alves@example.com",
      },
    ];

    // Distribute proposals among team members
    if (proposals && proposals.length > 0) {
      proposals.forEach((p, index) => {
        const memberIndex = index % teamMembers.length;
        teamMembers[memberIndex].assigned++;
      });
    }

    // Generate activity from proposals
    const activities = (proposals || []).slice(0, 5).map((p, index) => {
      const member = teamMembers[index % teamMembers.length];
      const grant = p.grants?.name || "Unknown Grant";
      const actions = ["created", "updated", "reviewed", "submitted", "commented on"];
      const action = actions[index % actions.length];
      
      const createdAt = new Date(p.created_at);
      const now = new Date();
      const diffHours = Math.floor((now - createdAt) / (1000 * 60 * 60));
      const timeAgo = diffHours < 24 
        ? `${diffHours} hours ago` 
        : `${Math.floor(diffHours / 24)} days ago`;

      return {
        user: member.name,
        action: action,
        target: grant,
        time: timeAgo,
      };
    });

    // Generate comments from proposals
    const comments = (proposals || []).slice(0, 3).map((p, index) => {
      const member = teamMembers[index % teamMembers.length];
      const grant = p.grants?.name || "Unknown Grant";
      const commentTexts = [
        "Great progress on the technical approach section. Consider adding more details about the methodology.",
        "The budget breakdown looks comprehensive. We should emphasize the ROI in the executive summary.",
        "Excellent work on the market analysis. The competitive landscape section is very thorough.",
      ];

      const createdAt = new Date(p.created_at);
      const now = new Date();
      const diffHours = Math.floor((now - createdAt) / (1000 * 60 * 60));
      const timeAgo = diffHours < 24 
        ? `${diffHours} hours ago` 
        : `${Math.floor(diffHours / 24)} days ago`;

      return {
        user: member.name,
        initials: member.initials,
        color: member.color,
        grant: grant,
        text: commentTexts[index % commentTexts.length],
        time: timeAgo,
      };
    });

    res.json({
      teamMembers,
      activities: activities.length > 0 ? activities : [
        { user: "System", action: "initialized", target: "Grant Crawler", time: "just now" },
      ],
      comments: comments.length > 0 ? comments : [],
      stats: {
        totalMembers: teamMembers.length,
        activeProposals: proposals?.length || 0,
        totalAssigned: teamMembers.reduce((sum, m) => sum + m.assigned, 0),
      },
    });
  } catch (error) {
    console.error("Team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/team/members - Get just team members
router.get("/members", async (req, res) => {
  try {
    // In production, this would fetch from customers table
    // For now, return demo data
    const teamMembers = [
      { id: "1", name: "Ana Silva", role: "Principal Investigator", initials: "AS", color: "bg-primary" },
      { id: "2", name: "João Santos", role: "Medical Expert", initials: "JS", color: "bg-secondary" },
      { id: "3", name: "Maria Costa", role: "AI Researcher", initials: "MC", color: "bg-accent" },
      { id: "4", name: "Pedro Alves", role: "Project Manager", initials: "PA", color: "bg-yellow-500" },
    ];

    res.json({ members: teamMembers });
  } catch (error) {
    console.error("Team members error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
