import * as React from 'react';
import { useState, useEffect } from 'react';
import { DataTable, Button } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Layout from '../layout/Layout';
import { showToastSuccess, showToastError } from '../ToastMessage';
import CampaignModal from '../layout/CampaignModal';

interface EmailObject {
  email: string;
  // add other properties if they exist
}

export interface Campaign {
  id: number | null;
  name: string;
  created_at: string;
  emails?: (string | EmailObject)[];  // Can be either strings or email objects
}

const CampaignMailScreen: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('http://localhost:8000/mail/campaigns/');
        if (!response.ok) {
          showToastError("Failed to retrieve campaigns");
          return;
        }
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        showToastError("Error fetching campaigns");
      }
    };

    fetchCampaigns();
  }, []);

  const onItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setPage(0);
  };

  const createEmptyCampaign = (): Campaign => ({
    id: null,
    name: '',
    created_at: new Date().toISOString(),
    emails: []
  });

  const openModal = (campaign: Campaign | null) => {
    setSelectedCampaign(campaign || createEmptyCampaign());
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCampaign(null);
  };

  const handleSave = async (name: string, emails: string[]) => {
    try {
      const isUpdate = selectedCampaign?.id !== null && selectedCampaign?.id !== undefined;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate 
        ? `http://localhost:8000/mail/campaigns/${selectedCampaign.id}/`
        : 'http://localhost:8000/mail/campaigns/';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, emails }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save campaign');
      }

      const data = await response.json();
      
      // Créez un objet campaign complet
      const updatedCampaign = {
        id: data.id,
        name: data.name,
        created_at: data.created_at,
        emails: data.emails 
      }
      setCampaigns(prev => {
        if (isUpdate) {
          return prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c);
        }
        return [...prev, updatedCampaign];
      });

      closeModal();
      showToastSuccess(isUpdate ? 'Campaign updated' : 'Campaign created');
    } catch (error) {
      console.error("Error saving campaign:", error);
      showToastError(error.message || 'An error occurred');
    }
  };


  const removeCampaign = async (campaign: Campaign) => {
    if (!campaign.id) return;

    try {
      const response = await fetch(`http://localhost:8000/mail/campaigns/${campaign.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
        showToastSuccess("Campaign removed");
      } else {
        throw new Error("Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      showToastError(error.message);
    }
  };

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, campaigns.length);

  return (
    <Layout>
      <View style={styles.container}>
        <DataTable style={styles.input}>
          <DataTable.Header>
            <DataTable.Title>Name</DataTable.Title>
            <DataTable.Title>Created At</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {campaigns.slice(from, to).map(campaign => (
            <DataTable.Row key={campaign.id || 'new'}>
              <DataTable.Cell>{campaign.name}</DataTable.Cell>
              <DataTable.Cell>{new Date(campaign.created_at).toLocaleDateString()}</DataTable.Cell>
              <DataTable.Cell>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Button 
                    icon="pencil" 
                    mode="text"
                    onPress={() => openModal(campaign)}
                    style={styles.actionButton}
                  >
                    Edit
                  </Button>
                  <Button 
                    icon="trash-can" 
                    mode="text"
                    onPress={() => removeCampaign(campaign)}
                    style={styles.actionButton}
                  >
                    Delete
                  </Button>
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(campaigns.length / itemsPerPage)}
            onPageChange={page => setPage(page)}
            label={`${from + 1}-${to} of ${campaigns.length}`}
            numberOfItemsPerPageList={[5, 10, 15]}
            numberOfItemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            showFastPaginationControls
            selectPageDropdownLabel={'Rows per page'}
          />
        </DataTable>

        <Button 
          icon="plus" 
          mode="text" 
          onPress={() => openModal(null)}
          style={styles.addButton}
        >
          Add Campaign
        </Button>

        <CampaignModal
          visible={modalVisible}
          onDismiss={closeModal}
          onSave={handleSave}
          selectedItem={selectedCampaign}
        />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,              // Comme dans Campaign
  },
  input: {
    flex: 1,                  // Comme table dans Campaign
  },
  actionsContainer: {         // Nouveau style comme dans Campaign
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {             // Nouveau style comme dans Campaign
    marginLeft: 8,
  },
  addButton: {                // Nouveau style comme dans Campaign
    marginTop: 16,
  }
});

export default CampaignMailScreen;