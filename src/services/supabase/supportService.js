import supabase from '../../lib/supabase'
import { authService } from './authService'

export const supportService = {
  async sendMessage(userId, message) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({ user_id: userId, message, status: 'pending' })
        .select()
        .single()
      if (error) throw error
      await authService.logActivity(userId, 'support_message', 'Sent support message')
      return { success: true, message: data }
    } catch (error) {
      console.error('Send message error:', error)
      return { success: false, error: error.message }
    }
  },

  async getUserMessages(userId) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get user messages error:', error)
      return []
    }
  },

  async getAllMessages() {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*, users:user_id (name, email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get all messages error:', error)
      return []
    }
  },

  async replyMessage(messageId, adminId, reply) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .update({ admin_reply: reply, reply_date: new Date().toISOString(), status: 'replied' })
        .eq('id', messageId)
        .select()
        .single()
      if (error) throw error
      await authService.logActivity(adminId, 'support_reply', `Replied to message ${messageId}`)
      return { success: true, message: data }
    } catch (error) {
      console.error('Reply message error:', error)
      return { success: false, error: error.message }
    }
  },
}