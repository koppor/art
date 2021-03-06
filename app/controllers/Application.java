package controllers;

import java.util.List;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import javax.persistence.TypedQuery;

import models.user.User;
import play.Configuration;
import play.Play;
import play.db.jpa.JPA;
import play.db.jpa.Transactional;
import play.libs.Json;
import play.mvc.Controller;
import play.mvc.Result;
import utils.exceptions.NoSessionException;
import utils.exceptions.SessionTimeoutException;

import com.lambdaworks.codec.Base64;

import com.tuplejump.playYeoman.Yeoman;
import html.index;

import dao.GenericDAO;

/**
 * Extends the general class {@link play.mvc.Controller}. Contains the method which
 * returns the index page of the ART application.
 * Is annotated with {@link javax.inject.Singleton}, which makes sure
 * the DI framework creates only one instance of the class.
 * 
 * @author cbi
 */
@Singleton
public class Application extends Controller {
	
	protected GenericDAO<User, Long> dao;
	private static Configuration CONF = Play.application().configuration();
	private static long timeout = Long.parseLong(CONF.getString("default.sessiontimeout")) * 60 * 1000;

	
	/**
	 * Constructor receives a {@link GenericDAO}. DI framework hook is "@Named("UserDAO")".
	 * 
	 * @param dao GenericDAO
	 */
	@Inject
	public Application(@Named("UserDAO") GenericDAO<User, Long> dao) {
		this.dao = dao;
	}

	/**
	 * Returns the index page of the ART application. Before the load its is checked
	 * if there is an existing session. If so, there logged ins userprofile is returned with the request.
	 * 
	 * @return HTTP result
	 */
	@Transactional(readOnly=true)
	public Result index() {
		String activeProfile = new String(Base64.encode(checkLogin().getBytes()));
		return ok(index.render(activeProfile));
		//return ok();
//		return ok(list.render());
	}
	
	
	/**
	 * Checks if there is an active session and returns currents User profile
	 * as a String (in JsonNode format).
	 * 
	 * @return current user profile as String
	 */
	public String checkLogin() {
		User user;
		try {
			String email = session().get("email");
			if(null == email) {
				throw new NoSessionException("No session");
			} else {
				long time = Long.parseLong(session().get("time"));
				int keeploggedin = Integer.parseInt(session().get("keeploggedin"));
				long currenttime = System.currentTimeMillis();
				long sessiontime = currenttime - time;
			
				if(sessiontime > timeout && keeploggedin != 1) {
					session().clear();
					throw new SessionTimeoutException("Session timeout");
				} /*else {
					session("time", Long.toString(currenttime));
				}*/
			}
			TypedQuery<User> query = JPA.em().createQuery(
				"select a from User a where a.email = :email", User.class);
			query.setParameter("email", email);
			List<User> data = dao.find(query);
			user = data.get(0);
		} catch (SessionTimeoutException e) {
			return e.getMessage();
		} catch (Exception e) {
			return "";
		}
		return Json.toJson(user).toString();
	}
}
