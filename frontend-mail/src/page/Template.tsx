import * as React from 'react';
import { useState, useEffect } from 'react';
import { DataTable, Button } from 'react-native-paper';
import { View, StyleSheet} from 'react-native';
import TemplateItemModal from '../layout/TemplateModal'; // Assurez-vous de bien importer ton Modal
import Layout from '../layout/Layout';
import { showToastSuccess, showToastError } from '../ToastMessage';
import TemplatePreview from '../layout/TemplatePreview';

export interface ItemTemplate {
  id: number;
  template_name: string;
  date_ts: string;
  sender: string;
  subject: string;
  from_email: string;
  body: string;
}

const TemplateScreen: React.FC = () => {
  // Example data (replace with your actual data fetching logic)
  const [items, setItems] = useState<ItemTemplate[]>([]);
  // const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:8000/mail/templates/', {
            method:'GET'
        }); 
        if (!response.ok) {
            showToastError("Failed to retrieve template");    
        }
        const data = await response.json();  // Parser la réponse en JSON
        
        // Vérifie si 'templates' est un tableau et contient des données
        if (Array.isArray(data.templates)) {
          setItems(data.templates);  // Mettre à jour l'état avec les données des templates
        } else {
          showToastError("Templates data is not an array or is empty");
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        //setLoading(false);  // On arrête le chargement après la requête
      }
    };

    fetchTemplates();
  }, []);  // On appelle cette fonction une seule fois au démarrage
  /*
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;  // Afficher un indicateur de chargement pendant la récupération des données
  }*/

  // Pagination states
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, items.length);
  const numberOfItemsPerPageList = [5, 10, 15];

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemTemplate | null>(null);

  const createEmptyTemplate = () : ItemTemplate => ({
    id: null,           
    template_name: '',
    date_ts: '',
    sender: '',
    subject: '',
    from_email: '',
    body: ''
  })

  const openModal = (item: ItemTemplate | null) => {
    console.log('Item selected for edit:', item); // Ajoute un log pour vérifier l'élément
    if(item == null){
        setSelectedItem(createEmptyTemplate());
    }
    else{
        setSelectedItem(item);  // Set the selected item to edit
    }
    setModalVisible(true);   // Open the modal
  };

  const closeModal = () => {
    setSelectedItem(null);   // Clear the selected item
    setModalVisible(false);  // Close the modal
  };

  const handleSave = async (updatedItem: ItemTemplate) => {
    try {
      let response;
      // Si un template a été sélectionné, on met à jour le template
      if (updatedItem.id) {
        response = await fetch(`http://localhost:8000/mail/templates/${updatedItem.id}/`, {
          method: 'PUT',  // Utilise PUT pour la mise à jour
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedItem),
        });
      } else {
        // Sinon, on crée un nouveau template
        response = await fetch('http://localhost:8000/mail/templates/', {
          method: 'POST', // Utilise POST pour la création
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedItem),
        });
      }
  
      if (response.ok) {
        const resp_json = await response.json();
        const template = resp_json.template;
        if (updatedItem.id) {
          // C'était un update
          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === template.id ? template : item
            )
          );
        } else {
          // C'était une création
          setItems((prevItems) => [...prevItems, template]);
        }
        setSelectedItem(null);  // Efface le template sélectionné
        setModalVisible(false); // Ferme le modal
        showToastSuccess(updatedItem.id ? 'Template updated' : 'Template saved');
      } else {
        showToastError(updatedItem.id ? 'Failed to update template' : 'Failed to save template');
      }
    } catch (error) {
      console.error("Error saving template:", error);
      showToastError("Request to API failed");
    }
  };

  const onItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
  };

  const removeProfile = async (itemToRemove: ItemTemplate) => {
    try {
        const response = await fetch(`http://localhost:8000/mail/templates/${itemToRemove.id}/`, {
          method: 'DELETE',
        });
    
        if (response.ok) {
          const resp_json = await response.json();
          const deletedItem = resp_json.template;
          setItems((prevItems) =>
            prevItems.filter(item => item.id !== deletedItem.id)
          );
          showToastSuccess("Template removed")
        } else {
          showToastError("Remove template failed for reason: ")
        }
      } catch (error) {
        console.error("Error deleting template:", error);
      }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <DataTable style={styles.input}>
          <DataTable.Header>
            <DataTable.Title>Template</DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Action</DataTable.Title>
          </DataTable.Header>

          {items.map((item) => (
            <DataTable.Row key={item.id}>
              <DataTable.Cell>{item.template_name}</DataTable.Cell>
              <DataTable.Cell>{item.date_ts}</DataTable.Cell>
              <DataTable.Cell>
                <View style={styles.actionsContainer}>
                  <Button 
                    icon="pencil" 
                    mode="text"
                    onPress={() => openModal(item)} 
                    style={styles.actionButton}
                  >
                    Edit
                  </Button>
                  <Button 
                    icon="trash-can" 
                    mode="text"
                    onPress={() => removeProfile(item)} 
                    style={styles.actionButton}
                  >
                    Remove
                  </Button>
                  <Button 
                    icon="eye" 
                    mode="text"
                    onPress={() => {
                      setSelectedItem(item);
                      setPreviewVisible(true)
                    }}
                    style={styles.actionButton}
                  >
                    Preview
                  </Button>
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(items.length / itemsPerPage)}
            onPageChange={(newPage) => setPage(newPage)}
            label={`${from + 1}-${to} of ${items.length}`}
            numberOfItemsPerPageList={numberOfItemsPerPageList}
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
          Add template
        </Button>

        {/* Modal for Editing Template */}
        {modalVisible && selectedItem && (
          <TemplateItemModal
            template={selectedItem}
            visible={modalVisible}
            onDismiss={closeModal}
            onSave={handleSave}
          />
        )}
        {previewVisible && selectedItem &&(
          <TemplatePreview
              templateHtml={selectedItem.body} 
              isOpen={previewVisible} 
              onClose={() => setPreviewVisible(false)} 
          />
        )

        }
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

export default TemplateScreen;
