import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  MessageSquare,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { MessageForm } from "@/components/admin/forms/MessageForm";
import { useToast } from "@/hooks/use-toast";

const initialMessages = [
  {
    id: 1,
    customer: "John Doe",
    email: "john@example.com",
    subject: "Order inquiry",
    message: "I would like to know the status of my recent order #1001.",
    status: "new",
    priority: "medium",
    assignedTo: "",
    date: "2024-01-20",
    lastReply: "2024-01-20",
  },
  {
    id: 2,
    customer: "Jane Smith",
    email: "jane@example.com",
    subject: "Product defect",
    message: "The trophy I received has a small dent on the side.",
    status: "in-progress",
    priority: "high",
    assignedTo: "support-team",
    date: "2024-01-19",
    lastReply: "2024-01-19",
  },
  {
    id: 3,
    customer: "Bob Johnson",
    email: "bob@example.com",
    subject: "Shipping question",
    message: "When will my order be shipped?",
    status: "resolved",
    priority: "low",
    assignedTo: "john",
    date: "2024-01-18",
    lastReply: "2024-01-18",
  },
  {
    id: 4,
    customer: "Alice Brown",
    email: "alice@example.com",
    subject: "Urgent: Wrong item",
    message:
      "I received the wrong trophy. This is for an important event tomorrow!",
    status: "new",
    priority: "urgent",
    assignedTo: "",
    date: "2024-01-17",
    lastReply: "2024-01-17",
  },
  {
    id: 5,
    customer: "Charlie Wilson",
    email: "charlie@example.com",
    subject: "Custom engraving",
    message: "Can you add custom engraving to my order?",
    status: "closed",
    priority: "medium",
    assignedTo: "jane",
    date: "2024-01-16",
    lastReply: "2024-01-16",
  },
];

export function MessagesPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState();
  const [deleteMessage, setDeleteMessage] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredMessages = messages.filter(
    (message) =>
      message.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateMessage = (messageData) => {
    const newMessage = {
      ...messageData,
      id: Math.max(...messages.map((m) => m.id), 0) + 1,
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsFormOpen(false);
    toast({
      title: "Message created",
      description: "Message has been created successfully.",
    });
  };

  const handleEditMessage = (messageData) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageData.id ? messageData : m))
    );
    setEditingMessage(undefined);
    toast({
      title: "Message updated",
      description: "Message has been updated successfully.",
    });
  };

  const handleDeleteMessage = (message) => {
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    setDeleteMessage(undefined);
    toast({
      title: "Message deleted",
      description: "Message has been deleted successfully.",
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      new: "destructive",
      "in-progress": "secondary",
      resolved: "default",
      closed: "outline",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: "outline",
      medium: "secondary",
      high: "default",
      urgent: "destructive",
    };

    const icons = {
      low: null,
      medium: null,
      high: <Clock className="h-3 w-3 mr-1" />,
      urgent: <AlertTriangle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[priority]} className="gap-1">
        {icons[priority]}
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            Customer support and communications
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Message
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.map((message) => (
              <TableRow key={message.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div>{message.customer}</div>
                      <div className="text-xs text-muted-foreground">
                        {message.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{message.subject}</TableCell>
                <TableCell>{getStatusBadge(message.status)}</TableCell>
                <TableCell>{getPriorityBadge(message.priority)}</TableCell>
                <TableCell>{message.assignedTo || "Unassigned"}</TableCell>
                <TableCell>
                  {new Date(message.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {message.message}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMessage(message)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteMessage(message)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Message Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Message</DialogTitle>
          </DialogHeader>
          <MessageForm
            onSubmit={handleCreateMessage}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog
        open={!!editingMessage}
        onOpenChange={() => setEditingMessage(undefined)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          {editingMessage && (
            <MessageForm
              message={editingMessage}
              onSubmit={handleEditMessage}
              onCancel={() => setEditingMessage(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Message Dialog */}
      <AlertDialog
        open={!!deleteMessage}
        onOpenChange={() => setDeleteMessage(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the message from "
              {deleteMessage?.customer}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteMessage && handleDeleteMessage(deleteMessage)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
