import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Layout from '../layout/Layout';
import { List, Button, TextInput, ActivityIndicator, Checkbox, IconButton, Divider, Text, Searchbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmtpContext } from '../context/SmtpContext';
import { showToastError, showToastSuccess } from '../ToastMessage';

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  isRead: boolean;
  hasAttachments: boolean;
}

const MailboxScreen: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const smtpContext = useContext(SmtpContext);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      if (!smtpContext) {
        showToastError('IMAP configuration is missing');
        return;
      }

      const { imapServer, imapPort, user, password, useImapTLS } = smtpContext;

      if (!imapServer || !imapPort || !user || !password) {
        showToastError('Missing IMAP configuration');
        return;
      }

      const params = new URLSearchParams({
        imap_server: imapServer,
        imap_port: imapPort.toString(),
        username: user,
        password: password,
        use_ssl: useImapTLS ? 'true' : 'false'
      });

      const response = await fetch(`http://localhost:8000/mail/mailbox/?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch emails');
      }

      const data = await response.json();
      const transformedEmails: Email[] = data.emails.map((email: any) => ({
        id: email.id,
        subject: email.subject || '(No subject)',
        from: email.sender || 'Unknown',
        date: email.date || new Date().toISOString(),
        body: email.body || '',
        isRead: false,
        hasAttachments: false
      }));

      setEmails(transformedEmails);
    } catch (error) {
      showToastError(error instanceof Error ? error.message : 'Failed to load emails');
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(email => email.id));
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchEmails();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Checkbox
              status={selectedEmails.length === emails.length ? 'checked' : 'unchecked'}
              onPress={handleSelectAll}
            />
            <IconButton icon="refresh" onPress={handleRefresh} />
            {selectedEmails.length > 0 && (
              <>
                <IconButton icon="delete" onPress={() => {/* Handle delete */}} />
                <IconButton icon="email-mark-as-unread" onPress={() => {/* Handle mark as unread */}} />
                <IconButton icon="folder" onPress={() => {/* Handle move to folder */}} />
              </>
            )}
          </View>
          <Searchbar
            placeholder="Search in emails"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        <Divider />

        {/* Email List */}
        <ScrollView style={styles.emailList}>
          {filteredEmails.map((email) => (
            <List.Item
              key={email.id}
              title={email.subject}
              description={email.from}
              left={() => (
                <View style={styles.emailLeft}>
                  <Checkbox
                    status={selectedEmails.includes(email.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleEmailSelection(email.id)}
                  />
                  {!email.isRead && <View style={styles.unreadDot} />}
                </View>
              )}
              right={() => (
                <View style={styles.emailRight}>
                  {email.hasAttachments && <IconButton icon="attachment" size={16} />}
                  <Text style={styles.date}>{formatDate(email.date)}</Text>
                </View>
              )}
              style={[
                styles.emailItem,
                !email.isRead && styles.unreadEmail,
                selectedEmails.includes(email.id) && styles.selectedEmail
              ]}
              onPress={() => {/* Handle email open */}}
            />
          ))}
        </ScrollView>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginLeft: 16,
    height: 40,
  },
  emailList: {
    flex: 1,
  },
  emailItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  emailRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadEmail: {
    backgroundColor: '#f8f9fa',
  },
  selectedEmail: {
    backgroundColor: '#e8f0fe',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
    marginLeft: 8,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});

export default MailboxScreen;