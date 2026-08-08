// components/ListaServidoresPaginada.jsx

import React, { useState, useEffect } from 'react';
import { getServidoresPaginado } from '../services/servidoresService';

const ListaServidoresPaginada = () => {
  // Estados para controlar os dados e a paginação
  const [servidores, setServidores] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [temMaisPaginas, setTemMaisPaginas] = useState(true);

  // Função para carregar a primeira página
  const carregarPrimeiraPagina = async () => {
    setCarregando(true);
    try {
      const resultado = await getServidoresPaginado(5); // 5 itens por página
      setServidores(resultado.servidores);
      setUltimoDoc(resultado.ultimoDocumentoDaPagina);
      setTemMaisPaginas(resultado.temMais);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Função para carregar mais servidores (próxima página)
  const carregarMaisServidores = async () => {
    if (!temMaisPaginas || carregando) return;

    setCarregando(true);
    try {
      const resultado = await getServidoresPaginado(5, ultimoDoc);
      setServidores((prevServidores) => [
        ...prevServidores,
        ...resultado.servidores,
      ]);
      setUltimoDoc(resultado.ultimoDocumentoDaPagina);
      setTemMaisPaginas(resultado.temMais);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Carrega a primeira página quando o componente monta
  useEffect(() => {
    carregarPrimeiraPagina();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <table className="w-full">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cargo</th>
            <th>Lotação</th>
            <th>Matrícula</th>
          </tr>
        </thead>
        <tbody>
          {servidores.map((servidor) => (
            <tr key={servidor.id}>
              <td>{servidor.nome}</td>
              <td>{servidor.cargo}</td>
              <td>{servidor.lotacao}</td>
              <td>{servidor.matricula}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {carregando && <p>Carregando...</p>}

      {temMaisPaginas && !carregando && (
        <button
          onClick={carregarMaisServidores}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Carregar Mais
        </button>
      )}
    </div>
  );
};

export default ListaServidoresPaginada;
