package controllers.smell;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import javax.persistence.TypedQuery;

import org.json.JSONObject;
import org.json.XML;

import com.fasterxml.jackson.databind.JsonNode;

import controllers.AbstractCRUDController;
import dao.GenericDAO;
import models.smell.Smell;
import models.status.ItemStatus;
import play.Logger;
import play.db.jpa.JPA;
import play.db.jpa.Transactional;
import play.libs.Json;
import play.mvc.Result;
import utils.actions.SessionAuth;
import utils.exceptions.ItemNotFoundException;
import utils.xml.XmlHelper;
import utils.xslfo.XslfoFromatter;

/**
 * Concrete implementation of an {@link AbstractCRUDController} to retrieve and manipulate
 * {@link Smell} Objects via RESTful HTTP Request.
 * 
 * @author cbi
 */
@Singleton
public class SmellController extends AbstractCRUDController<Smell, Long> {
	
	private String getAllQueryString = 
			"select a from " + dao.getModel().getSimpleName() + " a where a.status IN (:status) order by a.name";

	
	/**
	 * Constructor receives a {@link GenericDAO}. DI framework hook is "@Named("SmellDAO")".
	 * 
	 * @param dao GenericDAO
	 */
	@Inject
	public SmellController(@Named("SmellDAO") GenericDAO<Smell, Long> dao) {
		super(dao);
	}

	
	/**
	 * Provides all active Smells.
	 * 
	 * @return HTTP result
	 */
	@Override
	@Transactional(readOnly=true)
	public Result getAll() {
		List<Smell> data;
		try {
			String rolename = session().get("role");
			TypedQuery<Smell> query = JPA.em().createQuery(getAllQueryString, Smell.class);
			List<ItemStatus> status;

			if("Admin".equals(rolename) || "Editor".equals(rolename)) {
				status = Arrays.asList(ItemStatus.values());
			} else {
				status = Arrays.asList(ItemStatus.published);
			}

			query.setParameter("status", status);
			data = dao.find(query);
		} catch (Exception e) {
			String msg = "Failed to get all " + dao.getModel().getSimpleName();
			Logger.error(msg, e);
			return internalServerError(msg);
		}
		return ok(Json.toJson(data));
	}
	
	/**
	 * Returns a string which can be interpreted as a Javascript Object (user function eval()). The
	 * Javascript Object then contains a list of all {@link Smell} Objects in the format used as input 
	 * for jcloud (Open Source Tag Cloud Library). 
	 * 
	 * @return HTTP result
	 */
	@Transactional(readOnly=true)
	public Result getCloudSmells() {
		List<Smell> data;
		try {
			String rolename = session().get("role");
			TypedQuery<Smell> query = JPA.em().createQuery(getAllQueryString, Smell.class);
			List<ItemStatus> status;

			if("Admin".equals(rolename) || "Editor".equals(rolename)) {
				status = Arrays.asList(ItemStatus.values());
			} else {
				status = Arrays.asList(ItemStatus.published);
			}

			query.setParameter("status", status);
			data = dao.find(query);
		} catch (Exception e) {
			String msg = "Failed to get all " + dao.getModel().getSimpleName() + " for cloud.";
			Logger.error(msg, e);
			return internalServerError(msg);
		}
		StringBuffer buf = new StringBuffer("[");
		for (Smell smell : data) {
			buf.append("{\"text\":\"");
			buf.append(smell.getName());
			buf.append("\",\"weight\":");
			buf.append(smell.getWeight());
			buf.append(",\"handlers\":{\"click\":function(){setSmell('");
			buf.append(smell.getName());
			buf.append("');}}},");
		}
		
		// remove last "," but only if there where smells found.
		if(data.size() > 0) {
			buf.delete(buf.length()-1, buf.length());
		}
		
	    buf.append("]");
	    return ok(buf.toString());
	}

	/**
	 * Overwritten create method, which creates a new {@link Smell} object which has been
	 * deserialized from the delivered JsonNode object, via the {@link GenericDAO} object.
	 * 
	 * @see controllers.AbstractCRUDController#create()
	 */
	@SessionAuth
	@Override
	@Transactional
	public Result create() {
	    Smell inserted;
	    JsonNode node = null;
		try {
			node = request().body().asJson();
		    Smell smell = Json.fromJson(node, dao.getModel());
		    Timestamp currentTime = new Timestamp(System.currentTimeMillis());
		    smell.setCreated(currentTime);
		    smell.setModified(currentTime);
		    smell.setWeight(0);
		    smell.setStatus(ItemStatus.draft);
		    smell.configQuestionParents();
			inserted = dao.create(smell);
		} catch (Exception e) {
			String msg =" Failed to create " + dao.getModel().getSimpleName() ;
			Logger.error(msg + " JSON: " + node, e);
			return internalServerError(msg);
		}
	    return created(Json.toJson(inserted));
	}
	
	/**
	 * Overwritten updated method, saves changes of a {@link Smell} object which has been
	 * deserialized from the delivered JsonNode object, via the {@link GenericDAO} object.
	 * 
	 * @see controllers.AbstractCRUDController#update()
	 */
	@SessionAuth
	@Override
	@Transactional
	public Result update() {
		Smell updated;
		JsonNode node = null;
		try {
			node = request().body().asJson();
			Smell smell = Json.fromJson(node, dao.getModel());
		    Timestamp currentTime = new Timestamp(System.currentTimeMillis());
		    smell.setModified(currentTime);
		    smell.configQuestionParents();
		    updated = dao.update(smell);
		} catch (Exception e) {
			String msg = "Failed to update " + dao.getModel().getSimpleName();
			Logger.error(msg + " JSON: " + node, e);
			return internalServerError(msg);
		}
		return ok(Json.toJson(updated));
	}
	
	/**
	 * Returns a Smell as a formatted PDF. First the methods loads the Smell
	 * Object from the DataSource and converts it to JSON and than it is converted
	 * to XML with the org.json library. Might be a little bit overhead but it seems to be
	 * the easier way than to annotate the Model Beans both with JSON and XML Object values.
	 * The xml than is formatted with Apache FOP (Helper Class {@link XslfoFromatter}.
	 * 
	 * @param id Primary key of the Smell which has to be formatted to a PDF
	 * @return HTTP result
	 */
	@Transactional(readOnly=true)
	public Result getPDF(Long id) {
		Smell smell;
		byte [] pdfbytes;
		try {
			smell = dao.get(id);
			String jsonString = Json.toJson(smell).toString();
			JSONObject jsonobject = new JSONObject(jsonString);
			
			String requestUri =  "http://" + request().host() + "/#/smell/" + smell.getId();
			Logger.debug("Request URL: " + requestUri);

			StringBuffer xmlStringBuffer = new StringBuffer(XML.toString(jsonobject, "smell"));
			int firstbracket = xmlStringBuffer.indexOf(">") + 1;
			xmlStringBuffer.insert(firstbracket, "<uri>" + requestUri + "</uri>");
			
			// remove the not needed homepage tag, which can contain unmasked special characters
			String xmlstring = XmlHelper.removeTag("homepage", xmlStringBuffer.toString());
			Logger.debug("XML-String to format: " + xmlstring);
			InputStream stream = new ByteArrayInputStream(xmlstring.getBytes(StandardCharsets.UTF_8));

			pdfbytes = XslfoFromatter.format(stream, "Smell.xsl");
		} catch (ItemNotFoundException e) {
			Logger.error(e.getMessage(), e);
			return notFound(e.getMessage());
		} catch (Exception e) {
			String msg = "Failed to create PDF for " + dao.getModel().getSimpleName() + " with id " + id;
			Logger.error(msg, e);
			return internalServerError(msg);
		}
		String filename = "smell_" + id + ".pdf";
		response().setHeader("Content-Disposition", "attachment; filename=" + filename);
		return pdfbytes == null ? notFound() : ok(pdfbytes).as("application/pdf");
	}
}
