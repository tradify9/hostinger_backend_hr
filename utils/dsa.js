// DSA Algorithms and Data Structures for HR Portal Management
// This file contains implementations of HashMap, Graph, Tree (BST), Array operations, Sorting (Quicksort), and Queue.
// Each line is commented to explain its purpose, useful for managing employee data efficiently.

// HashMap Implementation using JavaScript Map
class HashMap {
    constructor() {
        this.map = new Map(); // Initialize a new Map to store key-value pairs
    }

    // Set a key-value pair in the HashMap
    set(key, value) {
        this.map.set(key, value); // Use Map's set method to add or update the key-value pair
    }

    // Get the value associated with a key
    get(key) {
        return this.map.get(key); // Use Map's get method to retrieve the value for the key
    }

    // Check if a key exists in the HashMap
    has(key) {
        return this.map.has(key); // Use Map's has method to check existence of the key
    }

    // Delete a key-value pair from the HashMap
    delete(key) {
        return this.map.delete(key); // Use Map's delete method to remove the key-value pair
    }

    // Get the size of the HashMap
    size() {
        return this.map.size; // Return the number of key-value pairs in the Map
    }
}

// Graph Implementation using Adjacency List (for employee relationships or org chart)
class Graph {
    constructor() {
        this.adjacencyList = {}; // Initialize an object to hold adjacency lists for each node
    }

    // Add a vertex (node) to the graph
    addVertex(vertex) {
        if (!this.adjacencyList[vertex]) { // Check if the vertex already exists
            this.adjacencyList[vertex] = []; // If not, create an empty array for its neighbors
        }
    }

    // Add an edge between two vertices (undirected)
    addEdge(vertex1, vertex2) {
        if (!this.adjacencyList[vertex1]) { // Ensure vertex1 exists
            this.addVertex(vertex1); // Add it if not
        }
        if (!this.adjacencyList[vertex2]) { // Ensure vertex2 exists
            this.addVertex(vertex2); // Add it if not
        }
        this.adjacencyList[vertex1].push(vertex2); // Add vertex2 to vertex1's list
        this.adjacencyList[vertex2].push(vertex1); // Add vertex1 to vertex2's list (undirected)
    }

    // Remove an edge between two vertices
    removeEdge(vertex1, vertex2) {
        this.adjacencyList[vertex1] = this.adjacencyList[vertex1].filter(v => v !== vertex2); // Remove vertex2 from vertex1's list
        this.adjacencyList[vertex2] = this.adjacencyList[vertex2].filter(v => v !== vertex1); // Remove vertex1 from vertex2's list
    }

    // Remove a vertex and all its edges
    removeVertex(vertex) {
        while (this.adjacencyList[vertex].length) { // While the vertex has neighbors
            const adjacentVertex = this.adjacencyList[vertex].pop(); // Remove the last neighbor
            this.removeEdge(vertex, adjacentVertex); // Remove the edge to that neighbor
        }
        delete this.adjacencyList[vertex]; // Delete the vertex from the adjacency list
    }

    // Depth-First Search (DFS) traversal
    dfs(start) {
        const result = []; // Array to store the traversal order
        const visited = {}; // Object to track visited nodes
        const adjacencyList = this.adjacencyList; // Reference to the adjacency list

        function dfsHelper(vertex) {
            if (!vertex) return; // Base case: if no vertex, return
            visited[vertex] = true; // Mark the vertex as visited
            result.push(vertex); // Add the vertex to the result
            adjacencyList[vertex].forEach(neighbor => { // For each neighbor
                if (!visited[neighbor]) { // If not visited
                    dfsHelper(neighbor); // Recursively visit the neighbor
                }
            });
        }

        dfsHelper(start); // Start DFS from the given vertex
        return result; // Return the traversal result
    }
}

// Binary Search Tree (BST) Implementation for Tree structure
class Node {
    constructor(value) {
        this.value = value; // Store the value in the node
        this.left = null; // Left child
        this.right = null; // Right child
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null; // Root of the tree
    }

    // Insert a value into the BST
    insert(value) {
        const newNode = new Node(value); // Create a new node with the value
        if (this.root === null) { // If tree is empty
            this.root = newNode; // Set as root
            return this; // Return the tree
        }
        let current = this.root; // Start from root
        while (true) { // Loop until insertion point is found
            if (value === current.value) return undefined; // If value exists, do nothing
            if (value < current.value) { // If value is less, go left
                if (current.left === null) { // If left is null
                    current.left = newNode; // Insert here
                    return this; // Return the tree
                }
                current = current.left; // Move to left child
            } else { // If value is greater, go right
                if (current.right === null) { // If right is null
                    current.right = newNode; // Insert here
                    return this; // Return the tree
                }
                current = current.right; // Move to right child
            }
        }
    }

    // Find a value in the BST
    find(value) {
        if (this.root === null) return false; // If tree is empty, return false
        let current = this.root; // Start from root
        let found = false; // Flag for found
        while (current && !found) { // While current exists and not found
            if (value < current.value) { // If value is less, go left
                current = current.left; // Move to left
            } else if (value > current.value) { // If value is greater, go right
                current = current.right; // Move to right
            } else { // If equal
                found = true; // Set found to true
            }
        }
        if (!found) return undefined; // If not found, return undefined
        return current; // Return the node
    }
}

// Array Operations (basic search, insert, delete for employee arrays)
class ArrayOps {
    constructor(arr = []) {
        this.arr = arr; // Initialize the array
    }

    // Linear search for a value in the array
    linearSearch(value) {
        for (let i = 0; i < this.arr.length; i++) { // Loop through each element
            if (this.arr[i] === value) { // If element matches value
                return i; // Return the index
            }
        }
        return -1; // If not found, return -1
    }

    // Insert a value at a specific index
    insertAt(index, value) {
        if (index < 0 || index > this.arr.length) return false; // Invalid index
        this.arr.splice(index, 0, value); // Use splice to insert at index
        return true; // Return success
    }

    // Delete a value at a specific index
    deleteAt(index) {
        if (index < 0 || index >= this.arr.length) return false; // Invalid index
        this.arr.splice(index, 1); // Use splice to remove at index
        return true; // Return success
    }
}

// Sorting: Quicksort Implementation
function quicksort(arr) {
    if (arr.length <= 1) { // Base case: if array has 1 or 0 elements
        return arr; // Return as is
    }
    const pivot = arr[arr.length - 1]; // Choose the last element as pivot
    const left = []; // Array for elements less than pivot
    const right = []; // Array for elements greater than pivot
    for (let i = 0; i < arr.length - 1; i++) { // Loop through elements except pivot
        if (arr[i] < pivot) { // If element is less than pivot
            left.push(arr[i]); // Add to left
        } else { // If element is greater or equal
            right.push(arr[i]); // Add to right
        }
    }
    return [...quicksort(left), pivot, ...quicksort(right)]; // Recursively sort left and right, combine
}

// Queue Implementation using Array
class Queue {
    constructor() {
        this.items = []; // Initialize an empty array for queue
    }

    // Add an element to the end of the queue
    enqueue(element) {
        this.items.push(element); // Use push to add to end
    }

    // Remove and return the first element of the queue
    dequeue() {
        if (this.isEmpty()) { // If queue is empty
            return "Underflow"; // Return underflow message
        }
        return this.items.shift(); // Use shift to remove from front
    }

    // Return the first element without removing it
    front() {
        if (this.isEmpty()) { // If queue is empty
            return "No elements in Queue"; // Return message
        }
        return this.items[0]; // Return the first element
    }

    // Check if the queue is empty
    isEmpty() {
        return this.items.length === 0; // Return true if length is 0
    }

    // Return the size of the queue
    size() {
        return this.items.length; // Return the length
    }

    // Print the queue elements
    print() {
        console.log(this.items.toString()); // Log the array as string
    }
}

// Export the classes and functions for use in other modules
module.exports = {
    HashMap,
    Graph,
    BinarySearchTree,
    ArrayOps,
    quicksort,
    Queue
};
