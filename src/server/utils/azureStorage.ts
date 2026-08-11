/**
 * Azure Blob Storage utility for cloud-native persistent storage
 * Replaces local file system operations with Azure Blob Storage
 * 
 * Configuration via environment variables:
 * - AZURE_STORAGE_CONNECTION_STRING: Azure Storage connection string
 * - AZURE_STORAGE_CONTAINER_NAME: Container name for blob storage (default: 'app-data')
 */

import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

export class AzureStorageService {
  private containerClient: ContainerClient | null = null;
  private connectionString: string;
  private containerName: string;

  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'app-data';
    
    if (this.connectionString) {
      this.initializeContainer();
    } else {
      console.warn('Azure Storage connection string not configured. File operations will fail.');
    }
  }

  private async initializeContainer(): Promise<void> {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
      this.containerClient = blobServiceClient.getContainerClient(this.containerName);
      
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'private'
      });
      
      console.log(`Azure Blob Storage container '${this.containerName}' initialized successfully`);
    } catch (error) {
      console.error('Failed to initialize Azure Blob Storage:', error);
      throw error;
    }
  }

  /**
   * Upload data to Azure Blob Storage
   * @param blobName - Name/path of the blob
   * @param data - Data to upload (string or Buffer)
   * @returns Upload result with blob URL
   */
  async uploadBlob(blobName: string, data: string | Buffer): Promise<{ url: string; blobName: string }> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not initialized. Check AZURE_STORAGE_CONNECTION_STRING.');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const uploadData = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
      
      await blockBlobClient.upload(uploadData, uploadData.length);
      
      return {
        url: blockBlobClient.url,
        blobName: blobName
      };
    } catch (error) {
      console.error(`Failed to upload blob '${blobName}':`, error);
      throw error;
    }
  }

  /**
   * Download data from Azure Blob Storage
   * @param blobName - Name/path of the blob
   * @returns Blob content as Buffer
   */
  async downloadBlob(blobName: string): Promise<Buffer> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not initialized. Check AZURE_STORAGE_CONNECTION_STRING.');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download(0);
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No data stream available');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error(`Failed to download blob '${blobName}':`, error);
      throw error;
    }
  }

  /**
   * Check if a blob exists
   * @param blobName - Name/path of the blob
   * @returns True if blob exists
   */
  async blobExists(blobName: string): Promise<boolean> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not initialized. Check AZURE_STORAGE_CONNECTION_STRING.');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      return await blockBlobClient.exists();
    } catch (error) {
      console.error(`Failed to check blob existence '${blobName}':`, error);
      return false;
    }
  }

  /**
   * Delete a blob from Azure Blob Storage
   * @param blobName - Name/path of the blob
   */
  async deleteBlob(blobName: string): Promise<void> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not initialized. Check AZURE_STORAGE_CONNECTION_STRING.');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      console.log(`Blob '${blobName}' deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete blob '${blobName}':`, error);
      throw error;
    }
  }

  /**
   * List all blobs in the container with optional prefix filter
   * @param prefix - Optional prefix to filter blobs
   * @returns Array of blob names
   */
  async listBlobs(prefix?: string): Promise<string[]> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not initialized. Check AZURE_STORAGE_CONNECTION_STRING.');
    }

    try {
      const blobNames: string[] = [];
      const options = prefix ? { prefix } : {};
      
      for await (const blob of this.containerClient.listBlobsFlat(options)) {
        blobNames.push(blob.name);
      }
      
      return blobNames;
    } catch (error) {
      console.error('Failed to list blobs:', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for temporary blob access
   * @param blobName - Name/path of the blob
   * @param expiryMinutes - Expiry time in minutes (default: 60)
   * @returns Signed URL for blob access
   */
  async getBlobSasUrl(blobName: string, expiryMinutes: number = 60): Promise<string> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not initialized. Check AZURE_STORAGE_CONNECTION_STRING.');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      // Note: SAS token generation requires additional setup
      // This is a placeholder - implement based on your security requirements
      return blockBlobClient.url;
    } catch (error) {
      console.error(`Failed to generate SAS URL for '${blobName}':`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const azureStorage = new AzureStorageService();

// Export helper functions for common operations
export const uploadFile = (fileName: string, data: string | Buffer) => 
  azureStorage.uploadBlob(fileName, data);

export const downloadFile = (fileName: string) => 
  azureStorage.downloadBlob(fileName);

export const fileExists = (fileName: string) => 
  azureStorage.blobExists(fileName);

export const deleteFile = (fileName: string) => 
  azureStorage.deleteBlob(fileName);

export const listFiles = (prefix?: string) => 
  azureStorage.listBlobs(prefix);
