import * as React from 'react';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { showToastError, showToastSuccess } from '../ToastMessage';

const AuthentificationCloud: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const login = async () => {
        try {
        const authLogin = {
            username: username,
            password: password
        }
        const response = await fetch('http://localhost:8888/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(authLogin),
        }); 
        if (!response.ok) {
            showToastError("Failed to retrieve template");    
        }
        const data = await response.json();  // Parser la réponse en JSON
        } catch (error) {
        console.error("Error fetching templates:", error);
        } finally {
        //setLoading(false);  // On arrête le chargement après la requête
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                label="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
            />

            <TextInput
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />

            <Button mode="contained" onPress={login}>
                Se connecter
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    input: {
        width: '80%',
        marginBottom: 16,
    },
});

export default AuthentificationCloud;
