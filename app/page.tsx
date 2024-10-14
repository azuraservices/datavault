'use client'

import { useState, useEffect, useMemo } from 'react'
import { RotateCw, Pencil, Trash2, EuroIcon, Search, SortAsc, SortDesc, RefreshCw, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import axios from 'axios'
import { useToast, toast } from "@/components/ui/use-toast"

interface VintageItem {
  id: number
  name: string
  category: string
  year: string
  purchasePrice: number
  purchaseDate: string
  currentValue: number
  image: string
  salePrice?: number
  saleDate?: string
  createdAt: number
}

interface FormErrors {
  [key: string]: boolean
}

interface SuggestedFields {
  category?: string;
  year?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  currentValue?: number;
  image?: string;
}

const calculateProfit = (item: VintageItem) => item.salePrice ? item.salePrice - item.purchasePrice : item.currentValue - item.purchasePrice
const calculateProfitPercentage = (item: VintageItem) => ((calculateProfit(item) / item.purchasePrice) * 100).toFixed(1)
const formatDate = (input: string) => {
  const cleaned = input.replace(/[^\d]/g, '')
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{4})$/)
  return match ? `${match[1]}/${match[2]}/${match[3]}` : input
}

const StatisticsCard = ({ items, title }: { items: VintageItem[], title: string }) => {
  const stats = useMemo(() => {
    const soldItems = items.filter(item => item.salePrice).length
    const unsoldItems = items.length - soldItems
    const totalSpent = items.reduce((sum, item) => sum + item.purchasePrice, 0)
    const totalValue = items.reduce((sum, item) => sum + (item.salePrice || item.currentValue), 0)
    const totalProfit = items.reduce((sum, item) => sum + calculateProfit(item), 0)
    const averageProfit = items.length > 0 ? totalProfit / items.length : 0
    const mostProfitableItem = items.length > 0 ? items.reduce((max, item) => calculateProfit(item) > calculateProfit(max) ? item : max, items[0]) : null

    return { soldItems, unsoldItems, totalSpent, totalValue, totalProfit, averageProfit, mostProfitableItem }
  }, [items])

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-3xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Articoli Venduti</p>
            <p className="text-lg font-bold">{stats.soldItems}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Articoli Non Venduti</p>
            <p className="text-lg font-bold">{stats.unsoldItems}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Totale Speso</p>
            <p className="text-lg font-bold">{stats.totalSpent.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Stima Valore Totale</p>
            <p className="text-lg font-bold">{stats.totalValue.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Profitto Totale</p>
            <p className="text-lg font-bold">{stats.totalProfit.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Profitto Medio</p>
            <p className="text-lg font-bold">{stats.averageProfit.toFixed(2)} €</p>
          </div>
        </div>
        {stats.mostProfitableItem && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Articolo Più Profittevole</p>
            <p className="text-lg font-bold">{stats.mostProfitableItem.name}</p>
            <p className="text-sm text-gray-600">Profitto: {calculateProfit(stats.mostProfitableItem).toFixed(2)} €</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ObjectVault() {
  const [items, setItems] = useState<VintageItem[]>([])
  const [newItem, setNewItem] = useState<Omit<VintageItem, 'id' | 'createdAt'>>({
    name: '', category: '', year: '', purchasePrice: 0, purchaseDate: '', currentValue: 0, image: '/images/placeholder.png'
  })
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<VintageItem | null>(null)
  const [sellingItem, setSellingItem] = useState<{ id: number, price: number } | null>(null)
  const [updatingValue, setUpdatingValue] = useState<{ id: number, currentValue: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [agent1Status, setAgent1Status] = useState<'idle' | 'loading' | 'complete'>('idle')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const { toast } = useToast()

  useEffect(() => {
    const savedItems = localStorage.getItem('vintageItems')
    const loadedItems = savedItems ? JSON.parse(savedItems) : []
    setItems(loadedItems)
    updateCategories(loadedItems)
  }, [])

  useEffect(() => {
    localStorage.setItem('vintageItems', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    const metaViewport = document.querySelector('meta[name=viewport]')
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0')
    } else {
      const newMetaViewport = document.createElement('meta')
      newMetaViewport.name = 'viewport'
      newMetaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
      document.head.appendChild(newMetaViewport)
    }
  }, [])

  const updateCategories = (items: VintageItem[]) => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category)))
    setCategories(uniqueCategories)
  }

  const validateForm = (item: Partial<VintageItem>): FormErrors => {
    const errors: FormErrors = {}
    const currentYear = new Date().getFullYear()

    if (!item.name) errors.name = true
    if (!item.category) errors.category = true
    if (!item.year) {
      errors.year = true
    } else {
      const yearNum = parseInt(item.year)
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear) {
        errors.year = true
      }
    }
    if (item.purchasePrice === undefined || item.purchasePrice === null) errors.purchasePrice = true
    if (!item.purchaseDate) {
      errors.purchaseDate = true
    } else {
      const purchaseDate = new Date(item.purchaseDate.split('/').reverse().join('-'))
      if (purchaseDate > new Date()) {
        errors.purchaseDate = true
      }
    }
    if (item.currentValue === undefined || item.currentValue === null) errors.currentValue = true

    return errors
  }

  const addItem = () => {
    const errors = validateForm(newItem)
    if (Object.keys(errors).length === 0) {
      const newItemWithId: VintageItem = { 
        ...newItem, 
        id: Date.now(), 
        createdAt: Date.now(),
        purchasePrice: Number(newItem.purchasePrice),
        currentValue: Number(newItem.currentValue)
      }
      setItems(prevItems => {
        const updatedItems = [newItemWithId, ...prevItems]
        updateCategories(updatedItems)
        return updatedItems
      })
      setNewItem({ name: '', category: '', year: '', purchasePrice: 0, purchaseDate: '', currentValue: 0, image: '/images/placeholder.png' })
      setIsAddingItem(false)
      toast({
        title: "Articolo aggiunto",
        description: `${newItemWithId.name} è stato aggiunto.`,
      })
    } else {
      setFormErrors(errors)
    }
  }

  const updateItem = (updatedItem: VintageItem) => {
    const errors = validateForm(updatedItem)
    if (Object.keys(errors).length === 0) {
      setItems(prevItems => {
        const updatedItems = prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
        updateCategories(updatedItems)
        return updatedItems
      })
      setEditingItem(null)
      toast({
        title: "Articolo aggiornato",
        description: `${updatedItem.name} è stato aggiornato.`,
      })
    } else {
      setFormErrors(errors)
    }
  }

  const sellItem = (id: number, salePrice: number) => {
    setItems(prevItems => prevItems.map(item => 
      item.id === id ? { ...item, salePrice, saleDate: new Date().toLocaleDateString('it-IT') } : item
    ))
    setSellingItem(null)
    toast({
      title: "Articolo venduto",
      description: `L'articolo è stato venduto per ${salePrice} €.`,
    })
  }

  const updateItemValue = (id: number, newValue: number) => {
    setItems(prevItems => prevItems.map(item => 
      item.id === id ? { ...item, currentValue: newValue } : item
    ))
    setUpdatingValue(null)
    toast({
      title: "Valore aggiornato",
      description: `Il valore dell'articolo è stato aggiornato a ${newValue} €.`,
    })
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2)
    if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5, 9)
    setter((prev: any) => ({ ...prev, purchaseDate: value }))
  }

  const findSuggestedPrice = async (item: VintageItem) => {
    setIsLoading(true);
    setError(null);
    setAgent1Status('loading');
    
    try {
        const prompt = `Trova il prezzo usato di ${item.name} dell'anno ${item.year} nella categoria ${item.category}. Restituisci un singolo prezzo, OUTPUT THE ANSWER IN JSON ONLY THE NUMBER (ES:300)`;
        
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const headers = {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json',
        };
        const data = {
            model: 'llama-3.2-90b-text-preview',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 150,
            top_p: 1,
            stream: false,
            stop: null
        };

        const response = await axios.post(url, data, { headers });
        setAgent1Status('complete');

        let agentResponse = response.data.choices[0].message.content;
        console.log('Agent 1 response:', agentResponse);
        agentResponse = agentResponse.trim();

        let extractedPrice;

        if (agentResponse.startsWith('{') && agentResponse.endsWith('}')) {
            try {
                const parsedResponse = JSON.parse(agentResponse);
                extractedPrice = parsedResponse.prezzo;
            } catch (error) {
                console.error('JSON parsing error:', error);
                setError('Errore nel parsing del prezzo. Riprova più tardi.');
                return item.currentValue;
            }
        } else {
            extractedPrice = agentResponse;
        }

        if (typeof extractedPrice === 'string') {
            extractedPrice = extractedPrice.replace(/[^\d]/g, '').trim();
        }

        const finalPrice = parseInt(extractedPrice, 10);

        if (isNaN(finalPrice)) {
            throw new Error('Il prezzo non è un numero valido');
        }

        return finalPrice;

    } catch (error) {
        console.error('Error in findSuggestedPrice:', error);
        setError('Si è verificato un errore durante il recupero del prezzo suggerito. Riprova più tardi.');
        toast({
            title: "Errore",
            description: "Si è verificato un errore durante il recupero del prezzo suggerito.",
            variant: "destructive",
        });
        return item.currentValue;
    } finally {
        setIsLoading(false);
    }
};
   

  const fetchSuggestedFields = async (productName: string): Promise<SuggestedFields> => {
    const prompt = `Inserisci le informazioni mancanti per un prodotto chiamato "${productName}". Fornisci solo le seguenti chiavi in formato JSON con esattamente questi nomi: category, year, purchasePrice, purchaseDate, currentValue, image. Assicurati che i tipi siano corretti (string per category, year, purchaseDate (dd/mm/yyyy), image(restituisci un URL diretto a  un'immagine pertinente al prodotto); number rounded (without decimals) per purchasePrice e currentValue).`;

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const headers = {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json'
    };
    const data = {
      model: 'llama-3.2-90b-text-preview',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 150,
      top_p: 1,
      stream: false,
      stop: null
    };

    try {
      const response = await axios.post(url, data, { headers });
      const content = response.data.choices[0].message.content;
      console.log("Risposta API:", content);

      const parsed = parseJSONContent(content);
      return parsed;
    } catch (error: any) {
      console.error('Error in fetchSuggestedFields:', error);

      if (error instanceof SyntaxError) {
        throw new Error(`Impossibile parsare la risposta del modello AI. Output ricevuto: ${error.message}`);
      }

      throw new Error(`Impossibile ottenere i suggerimenti dal modello AI. Dettagli: ${error.message}`);
    }
  };

  const parseJSONContent = (content: string): SuggestedFields => {
    try {
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}') + 1;
      if (start === -1 || end === -1) throw new Error('Formato JSON non trovato nella risposta.');

      const jsonString = content.substring(start, end);
      const parsed: SuggestedFields = JSON.parse(jsonString);

      if (
        typeof parsed.category !== 'string' ||
        typeof parsed.year !== 'string' ||
        typeof parsed.purchasePrice !== 'number' ||
        typeof parsed.purchaseDate !== 'string' ||
        typeof parsed.currentValue !== 'number' ||
        typeof parsed.image !== 'string'
      ) {
        throw new Error('Tipi di dati non validi nel JSON suggerito.');
      }

      return parsed;
    } catch (error) {
      console.error('Errore nel parsing del JSON:', error);
      throw new SyntaxError(`Errore nel parsing del JSON suggerito.`);
    }
  };

  const handleAICompletion = async (itemName: string, setter: React.Dispatch<React.SetStateAction<any>>) => {
    if (!itemName.trim()) {
      toast({
        title: "Nome prodotto mancante",
        description: "Inserisci il nome del prodotto prima di completare automaticamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const suggestedFields = await fetchSuggestedFields(itemName.trim());
      console.log("Campi suggeriti dall'AI:", suggestedFields);

      setter((prev: any) => ({
        ...prev,
        category: suggestedFields.category || prev.category,
        year: suggestedFields.year || prev.year,
        purchasePrice: suggestedFields.purchasePrice !== undefined ? suggestedFields.purchasePrice : prev.purchasePrice,
        purchaseDate: suggestedFields.purchaseDate ? formatDate(suggestedFields.purchaseDate) : prev.purchaseDate,
        currentValue: suggestedFields.currentValue !== undefined ? suggestedFields.currentValue : prev.currentValue,
        image: suggestedFields.image || prev.image,
      }));

      toast({
        title: "Completamento AI riuscito",
        description: "I campi sono stati compilati con i suggerimenti dell'AI.",
      });
    } catch (error: any) {
      console.error('Error in handleAICompletion:', error);
      const errorMessage = error.message || 'Si è verificato un errore durante il completamento AI. Riprova più tardi.';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(item => {
        if (filterBy === 'all') return true
        if (filterBy === 'sold') return item.salePrice !== undefined
        if (filterBy === 'unsold') return item.salePrice === undefined
        return true
      })
      .filter(item => filterCategory === 'all' || item.category === filterCategory)
      .sort((a, b) => {
        let comparison = 0
        if (sortBy === 'profit') comparison = calculateProfit(b) - calculateProfit(a)
        else if (sortBy === 'date') comparison = new Date(b.purchaseDate.split('/').reverse().join('-')).getTime() - new Date(a.purchaseDate.split('/').reverse().join('-')).getTime()
        else if (sortBy === 'percentage') comparison = Number(calculateProfitPercentage(b)) - Number(calculateProfitPercentage(a))
        else if (sortBy === 'createdAt') comparison = b.createdAt - a.createdAt

        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [items, searchTerm, filterBy, filterCategory, sortBy, sortOrder])

  const renderItemCard = (item: VintageItem) => (
    <motion.div
      key={item.id}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-3xl mx-auto">
        <Tabs defaultValue="details" className="w-full p-4">
          <TabsList className="grid mx-auto grid-cols-2">
            <TabsTrigger value="details">Dettagli</TabsTrigger>
            <TabsTrigger value="actions">Azioni</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <CardContent className="p-2 pt-6 pb-3">
              <div className="flex items-center mb-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg mr-4 object-cover" />
                <div>
                  <h3 className="text-lg font-semibold">{item.category}</h3>
                  <h2 className="text-2xl font-bold">{item.name}</h2>
                  <p className="text-gray-600">{item.year}</p>
                </div>
              </div>
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Prezzo di acquisto</p>
                  <p className="text-lg font-bold">{item.purchasePrice} €</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data di acquisto</p>
                  <p className="text-lg font-bold">{item.purchaseDate}</p>
                </div>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {item.salePrice ? "Prezzo di vendita" : "Valore attuale stimato"}
                  </p>
                  <p className="text-2xl font-bold">
                    {item.salePrice || item.currentValue} €
                  </p>
                </div>
                {!item.salePrice && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setUpdatingValue({ id: item.id, currentValue: item.currentValue })}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className={`p-4 rounded-lg ${calculateProfit(item) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <h4 className="text-lg font-semibold mb-2">
                  {calculateProfit(item) >= 0 ? 
                    (item.salePrice ? "Profitto realizzato" : "Profitto potenziale") :
                    (item.salePrice ? "Perdita realizzata" : "Perdita potenziale")
                  }
                </h4>
                <p className={`text-3xl font-bold ${calculateProfit(item) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(calculateProfit(item))} €
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-bold">{calculateProfitPercentage(item)}%</span> 
                  {calculateProfit(item) >= 0 ? ' guadagno netto' : ' perdita netta'} in {calculateTimeSinceAcquisition(item.purchaseDate, item.saleDate)}
                </p>
              </div>
            </CardContent>
          </TabsContent>
          <TabsContent value="actions">
            <CardContent className="p-0">
              <div className="flex flex-col space-y-4 pt-6">
                <div className="flex items-center mb-2 pl-2">
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg mr-4 object-cover" />
                  <div>
                    <h3 className="text-lg font-semibold">{item.category}</h3>
                    <h2 className="text-2xl font-bold">{item.name}</h2>
                    <p className="text-gray-600">{item.year}</p>
                  </div>
                </div>
                {!item.salePrice && (
                  <Button 
                    variant="outline" 
                    className="w-full text-blue-600 hover:text-blue-800"
                    onClick={() => setSellingItem({ id: item.id, price: item.currentValue })}
                  >
                    <EuroIcon className="h-4 w-4 mr-2" />
                    Vendi
                  </Button>
                )}
                {!item.salePrice && (
                  <Button 
                    variant="outline"
                    className="w-full text-blue-600 hover:text-blue-800"
                    onClick={() => setEditingItem(item)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-800" 
                  onClick={() => {
                    setItems(prevItems => prevItems.filter(i => i.id !== item.id))
                    toast({
                      title: "Articolo eliminato",
                      description: `${item.name} è stato eliminato.`,
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-black mb-2 text-center">DataVAULT</h1>
      <p className="text-center mb-6 text-gray-600 max-w-3xl mx-auto">Gestisci e valorizza i tuoi articoli 💎 Traccia profitti e statistiche 📊 Usa l'IA per stimare 🔮</p>

      <div className="mb-6 space-y-4 max-w-3xl mx-auto">
        <Input
          placeholder="Cerca tra i tuoi articoli..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full sm:flex-grow">
              <SelectValue placeholder="Filtra articoli" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli articoli</SelectItem>
              <SelectItem value="sold">Articoli venduti</SelectItem>
              <SelectItem value="unsold">Articoli non venduti</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:flex-grow">
              <SelectValue placeholder="Filtra per categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le categorie</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:flex-grow">
              <SelectValue placeholder="Ordina per" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Data di inserimento</SelectItem>
              <SelectItem value="profit">Profitto potenziale</SelectItem>
              <SelectItem value="date">Data di acquisto</SelectItem>
              <SelectItem value="percentage">% di guadagno</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full sm:flex-grow"
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {filteredAndSortedItems.map(renderItemCard)}
        <StatisticsCard 
          items={filteredAndSortedItems} 
          title={filterCategory === 'all' ? 'Statistiche Generali' : `Statistiche ${filterCategory}`}
        />
      </motion.div>

      <div className="flex justify-center mt-8 space-x-4">
        <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddingItem(true)}>Aggiungi Nuovo Articolo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Articolo</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli del nuovo articolo qui.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {[
                { key: 'name', label: 'Nome', type: 'text' },
                { key: 'category', label: 'Categoria', type: 'text' },
                { key: 'year', label: 'Anno', type: 'number' },
                { key: 'purchasePrice', label: 'Prezzo di Acquisto', type: 'number' },
                { key: 'purchaseDate', label: 'Data di Acquisto', type: 'text' },
                { key: 'currentValue', label: 'Valore Attuale', type: 'number' },
                { key: 'image', label: 'URL Immagine', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor={key} className="text-right col-span-2">{label}</Label>
                  <Input
                    id={key}
                    type={type}
                    value={newItem[key as keyof typeof newItem]}
                    onChange={(e) => {
                      if (key === 'purchaseDate') {
                        handleDateChange(e, setNewItem)
                      } else if (key === 'purchasePrice' || key === 'currentValue') {
                        setNewItem({ ...newItem, [key]: e.target.value === '' ? null : Number(e.target.value) })
                      } else {
                        setNewItem({ ...newItem, [key]: e.target.value })
                      }
                      setFormErrors(prev => ({ ...prev, [key]: false }))
                    }}
                    className={`col-span-3 ${formErrors[key as keyof FormErrors] ? 'border-red-500' : ''}`}
                    placeholder={`${key === 'name' ? 'Apple iPhone 16 256gb' : 
                                      key === 'category' ? 'Elettronica' : 
                                      key === 'year' ? '2024' : 
                                      key === 'purchasePrice' ? '100' : 
                                      key === 'purchaseDate' ? 'dd/mm/yyyy' : 
                                      key === 'currentValue' ? '300' : 
                                      '/images/typewriter.jpg'}`}
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="flex flex-col space-y-4 md:flex-row md:space-y-0">
              <Button onClick={() => handleAICompletion(newItem.name, setNewItem)} disabled={!newItem.name || isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Completamento AI
              </Button>
              <Button onClick={addItem}>Salva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button onClick={() => {
          const newItem = generateRandomItem()
          setItems(prevItems => {
            const updatedItems = [newItem, ...prevItems]
            updateCategories(updatedItems)
            return updatedItems
          })
          toast({
            title: "Articolo casuale aggiunto",
            description: `${newItem.name} è stato aggiunto.`,
          })
        }}>Articolo Casuale</Button>
      </div>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Articolo</DialogTitle>
            <DialogDescription>
              Modifica i dettagli del tuo articolo qui.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              {[
                { key: 'name', label: 'Nome', type: 'text' },
                { key: 'category', label: 'Categoria', type: 'text' },
                { key: 'year', label: 'Anno', type: 'number' },
                { key: 'purchasePrice', label: 'Prezzo di Acquisto', type: 'number' },
                { key: 'purchaseDate', label: 'Data di Acquisto', type: 'text' },
                { key: 'currentValue', label: 'Valore Attuale', type: 'number' },
                { key: 'image', label: 'URL Immagine', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor={`edit-${key}`} className="text-right col-span-2">{label}</Label>
                  <Input
                    id={`edit-${key}`}
                    type={type}
                    value={editingItem[key as keyof VintageItem]}
                    onChange={(e) => {
                      if (key === 'purchaseDate') {
                        handleDateChange(e, setEditingItem)
                      } else if (key === 'purchasePrice' || key === 'currentValue') {
                        setEditingItem({ ...editingItem, [key]: e.target.value === '' ? null : Number(e.target.value) })
                      } else {
                        setEditingItem({ ...editingItem, [key]: e.target.value })
                      }
                      setFormErrors(prev => ({ ...prev, [key]: false }))
                    }}
                    className={`col-span-3 ${formErrors[key as keyof FormErrors] ? 'border-red-500' : ''}`}
                    placeholder={`${key === 'name' ? 'Apple iPhone 16 256gb'  : 
                                      key === 'category' ? 'Elettronica' : 
                                      key === 'year' ? '2024' : 
                                      key === 'purchasePrice' ? '100' : 
                                      key === 'purchaseDate' ? 'dd/mm/yyyy' : 
                                      key === 'currentValue' ? '300' : 
                                      '/images/typewriter.jpg'}`}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="flex flex-col space-y-4 md:flex-row md:space-y-0">
            <Button onClick={() => editingItem && handleAICompletion(editingItem.name, setEditingItem)} disabled={!editingItem?.name || isLoading} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Wand2 className="mr-2 h-4 w-4" />
              Completamento AI
            </Button>
            <Button onClick={() => editingItem && updateItem(editingItem)}>Salva Modifiche</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sellingItem} onOpenChange={() => setSellingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vendi Articolo</DialogTitle>
            <DialogDescription>
              Inserisci il prezzo di vendita dell'articolo.
            </DialogDescription>
          </DialogHeader>
          {sellingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-5 items-center gap-4">
                <Label htmlFor="sale-price" className="text-right col-span-2">Prezzo di Vendita</Label>
                <Input
                  id="sale-price"
                  type="number"
                  value={sellingItem.price}
                  onChange={(e) => setSellingItem({ ...sellingItem, price: Number(e.target.value) })}
                  className="col-span-3"
                  placeholder="es. 350"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => sellingItem && sellItem(sellingItem.id, sellingItem.price)}>Conferma Vendita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!updatingValue} 
        onOpenChange={(open) => {
          if (!open) {
            setUpdatingValue(null)
            setAgent1Status('idle')
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiorna Valore Attuale</DialogTitle>
            <DialogDescription>
              Aggiorna il valore attuale dell'articolo o usa il prezzo suggerito.
            </DialogDescription>
          </DialogHeader>
          {updatingValue && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-5 items-center gap-4">
                <Label htmlFor="current-value" className="text-right col-span-2">Valore Attuale</Label>
                <Input
                  id="current-value"
                  type="number"
                  value={updatingValue.currentValue}
                  onChange={(e) => setUpdatingValue({ ...updatingValue, currentValue: Number(e.target.value) })}
                  className="col-span-3"
                  placeholder="es. 350"
                />
              </div>
              <Button 
                onClick={async () => {
                  const item = items.find(i => i.id === updatingValue.id)
                  if (item) {
                    const suggestedPrice = await findSuggestedPrice(item)
                    setUpdatingValue({ ...updatingValue, currentValue: suggestedPrice })
                  }
                }}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? 'Caricamento...' : 'Trova Prezzo'}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="mr-2">Ricerca del prezzo online</span>
                  {agent1Status === 'idle' ? <AlertCircle className="h-4 w-4 text-gray-400" /> :
                   agent1Status === 'loading' ? <RotateCw className="h-4 w-4 text-blue-500 animate-spin" /> :
                   <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => updatingValue && updateItemValue(updatingValue.id, updatingValue.currentValue)}>Aggiorna Valore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const calculateTimeSinceAcquisition = (purchaseDate: string, saleDate?: string) => {
  const start = new Date(purchaseDate.split('/').reverse().join('-'))
  const end = saleDate ? new Date(saleDate.split('/').reverse().join('-')) : new Date()
  const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return `${diffDays} giorni`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mesi`
  const diffYears = Math.floor(diffDays / 365)
  return `${diffYears} ann${diffYears > 1 ? 'i' : 'o'}`
}

const generateRandomItem = (): VintageItem => {
  const categories = ["Elettronica", "Mobili", "Arte", "Gioielli", "Libri"]
  const currentYear = new Date().getFullYear()
  const randomYear = Math.floor(Math.random() * (currentYear - 1900) + 1900)
  const randomPurchaseDate = new Date(Math.floor(Math.random() * (Date.now() - new Date(randomYear, 0).getTime()) + new Date(randomYear, 0).getTime()))
  const randomPurchasePrice = Math.floor(Math.random() * 1000) + 50
  const randomCurrentValue = randomPurchasePrice * (1 + Math.random() * 2)
  const randomPlaceholder = Math.floor(Math.random() * 5)
  const placeholderImage = randomPlaceholder === 0 ? "/images/placeholder.png" : `/images/placeholder${randomPlaceholder}.png`

  return {
    id: Date.now(),
    name: `Articolo ${Math.floor(Math.random() * 1000)}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    year: randomYear.toString(),
    purchasePrice: randomPurchasePrice,
    purchaseDate: randomPurchaseDate.toLocaleDateString('it-IT'),
    currentValue: Math.floor(randomCurrentValue),
    image: placeholderImage,
    createdAt: Date.now()
  }
}

const extractPrice = (finalPrice: string) => {
  const price = finalPrice.replace(/[^0-9.]/g, '');
  return `${Math.round(parseFloat(price))}€`;
};