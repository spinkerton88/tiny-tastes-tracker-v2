
import React, { useState } from 'react';
import { Recipe } from '../../types';
import { importRecipeFromImage } from '../../services/geminiService';
import Icon from '../ui/Icon';

interface AiImportModalProps {
  onClose: () => void;
  onRecipeParsed: (recipe: Partial<Recipe>) => void;
}

const AiImportModal: React.FC<AiImportModalProps> = ({ onClose, onRecipeParsed }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const recipeData = await importRecipeFromImage(file);
            onRecipeParsed(recipeData);
        } catch (err: any) {
            setError(err.message || "Failed to parse recipe.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                <div className="flex justify-between items-center border-b p-4">
                    <h2 className="text-xl font-semibold text-blue-600">Import Recipe from Image</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">Upload a photo of a recipe (from a cookbook or screenshot) and AI will try to extract the details.</p>
                    <input type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    {preview && <img src={preview} alt="Image preview" className="w-full h-auto max-h-48 object-contain rounded-md border"/>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button onClick={handleSubmit} disabled={!file || loading} className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                        {loading ? <div className="spinner h-5 w-5 border-2"></div> : 'Upload and Analyze'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiImportModal;
